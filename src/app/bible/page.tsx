"use client";
import React, { useState, useEffect } from 'react';
import styles from './bible.module.css';
import { getVerseExplanationMultiple } from '@/services/verseExplanation';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';
import RateLimitAlert from '@/components/RateLimitAlert';
import { useSpeechSynthesis } from '@/components/SpeechSynthesis';
import MuteButton from '@/components/MuteButton';
import Toast from '@/components/Toast';
import { useTranslation } from '@/hooks/useTranslation';

interface BibleVerse {
  abbrev: string;
  chapters: string[][];
}
//TODO: IMPLEMENT BIBLE IN ENGLISH ASWELL 

// Map of abbreviations to full book names with proper encoding
const bookNames: { [key: string]: string } = {
  'gn': 'Génesis',
  'ex': 'Éxodo',
  'lv': 'Levítico',
  'nm': 'Números',
  'dt': 'Deuteronomio',
  'js': 'Josué',
  'jud': 'Jueces',
  'rt': 'Rut',
  '1sm': '1 Samuel',
  '2sm': '2 Samuel',
  '1kgs': '1 Reyes',
  '2kgs': '2 Reyes',
  '1ch': '1 Crónicas',
  '2ch': '2 Crónicas',
  'ezr': 'Esdras',
  'ne': 'Nehemías',
  'et': 'Ester',
  'job': 'Job',
  'ps': 'Salmos',
  'prv': 'Proverbios',
  'ec': 'Eclesiastés',
  'so': 'Cantares',
  'is': 'Isaías',
  'jr': 'Jeremías',
  'lm': 'Lamentaciones',
  'ez': 'Ezequiel',
  'dn': 'Daniel',
  'ho': 'Oseas',
  'jl': 'Joel',
  'am': 'Amós',
  'ob': 'Abdías',
  'jn': 'Jonás',
  'mi': 'Miqueas',
  'na': 'Nahúm',
  'hk': 'Habacuc',
  'zp': 'Sofonías',
  'hg': 'Hageo',
  'zc': 'Zacarías',
  'ml': 'Malaquías',
  'mt': 'Mateo',
  'mk': 'Marcos',
  'lk': 'Lucas',
  'jo': 'Juan',
  'act': 'Hechos',
  'rm': 'Romanos',
  '1co': '1 Corintios',
  '2co': '2 Corintios',
  'gl': 'Gálatas',
  'eph': 'Efesios',
  'ph': 'Filipenses',
  'cl': 'Colosenses',
  '1ts': '1 Tesalonicenses',
  '2ts': '2 Tesalonicenses',
  '1tm': '1 Timoteo',
  '2tm': '2 Timoteo',
  'tt': 'Tito',
  'phm': 'Filemón',
  'hb': 'Hebreos',
  'jm': 'Santiago',
  '1pe': '1 Pedro',
  '2pe': '2 Pedro',
  '1jo': '1 Juan',
  '2jo': '2 Juan',
  '3jo': '3 Juan',
  'jd': 'Judas',
  're': 'Apocalipsis'
};

// Function to normalize and decode book names
const decodeBookName = (abbrev: string): string => {
  try {
    const name = bookNames[abbrev] || abbrev;
    // Normalize the string to handle composed characters
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (error) {
    //console.error('Error decoding book name:', error);
    return abbrev;
  }
};

// Function to normalize search text
const normalizeText = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const cleanText = (text: string): string => {
  return text
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\*/g, '') // Remove markdown italic
    .replace(/_/g, '') // Remove markdown underline
    .replace(/`/g, '') // Remove markdown code
    .replace(/#/g, '') // Remove markdown headers
    .replace(/>/g, '') // Remove markdown blockquotes
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export default function BibleReader() {
  const { userName } = useUserName();
  const { showRateLimitAlert, rateLimitInfo, setShowRateLimitAlert, setRateLimitInfo } = useRateLimit();
  const [bibleData, setBibleData] = useState<BibleVerse[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('gn');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [response, setResponse] = useState<string | null>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const [showToast, setShowToast] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);
  const { t, language } = useTranslation();

  // Load Bible data based on language
  useEffect(() => {
    const loadBibleData = async () => {
      try {
        setLoading(true);
        setError(null);
        let file = '/assets/es_rvr.json';
        if (language === 'en') file = '/assets/en_bbe.json';
        // Add cache-busting query string
        const cacheBuster = `?v=${Date.now()}`;
        const response = await fetch(file + cacheBuster);
        if (!response.ok) {
          throw new Error('Failed to load Bible data');
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid Bible data format');
        }
        setBibleData(data);
        // Restore last selected book/chapter/verse for this language
        const bookKey = `bible_selectedBook_${language}`;
        const chapterKey = `bible_selectedChapter_${language}`;
        const versesKey = `bible_selectedVerses_${language}`;
        const storedBook = localStorage.getItem(bookKey);
        const storedChapter = localStorage.getItem(chapterKey);
        const storedVerses = localStorage.getItem(versesKey);
        if (storedBook) setSelectedBook(storedBook);
        if (storedChapter) setSelectedChapter(Number(storedChapter));
        if (storedVerses) setSelectedVerses(JSON.parse(storedVerses));
      } catch (error) {
        console.error('Error loading Bible data:', error);
        setError('Error loading Bible data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadBibleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Persist selection per language
  useEffect(() => {
    localStorage.setItem(`bible_selectedBook_${language}`, selectedBook);
    localStorage.setItem(`bible_selectedChapter_${language}`, String(selectedChapter));
    localStorage.setItem(`bible_selectedVerses_${language}`, JSON.stringify(selectedVerses));
  }, [selectedBook, selectedChapter, selectedVerses, language]);

  const currentBook = bibleData.find(book => book.abbrev === selectedBook);
  const currentChapter = currentBook?.chapters[selectedChapter - 1] || [];

  const handleBookChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBook(event.target.value);
    setSelectedChapter(1);
    setSelectedVerses([]);
    setShowExplanation(false);
  };

  const handleChapterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChapter(Number(event.target.value));
    setSelectedVerses([]);
    setShowExplanation(false);
  };

  const handleVerseClick = (verseNumber: number, event: React.MouseEvent) => {
    setSelectedVerses(prev => {
      // If verse is already selected, remove it
      if (prev.includes(verseNumber)) {
        const newSelection = prev.filter(v => v !== verseNumber);
        if (newSelection.length === 0) {
          setShowExplanation(false);
        }
        return newSelection;
      }
      
      // If verse is not selected and we haven't reached the limit of 10 verses
      if (prev.length < 10) {
        const newSelection = [...prev, verseNumber].sort((a, b) => a - b);
        if (newSelection.length > 0 && !showExplanation) {
          setShowExplanation(true);
          
          // Safely get the verse element position
          const verseElement = event.currentTarget as HTMLElement;
          if (verseElement) {
            const rect = verseElement.getBoundingClientRect();
            setPosition({
              x: rect.left,
              y: rect.bottom + window.scrollY + 10 // Add some padding
            });
          } else {
            // Fallback position if element is not found
            setPosition({
              x: window.innerWidth / 2 - 250, // Center horizontally
              y: window.scrollY + 100 // Below the top of the viewport
            });
          }
        }
        return newSelection;
      }
      
      // If we've reached the limit, don't add more verses
      return prev;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const normalizedQuery = normalizeText(query.toLowerCase());
    const results = [];
    
    for (const book of bibleData) {
      for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
        const chapter = book.chapters[chapterIndex];
        for (let verseIndex = 0; verseIndex < chapter.length; verseIndex++) {
          const verse = chapter[verseIndex];
          if (normalizeText(verse.toLowerCase()).includes(normalizedQuery)) {
            results.push({
              book: bookNames[book.abbrev] || book.abbrev,
              chapter: chapterIndex + 1,
              verse: verseIndex + 1,
              text: verse
            });
          }
        }
      }
    }
    setSearchResults(results.slice(0, 10));
  };

  const handleZoom = (delta: number) => {
    setFontSize(prev => Math.min(Math.max(12, prev + delta), 24));
  };

  const handleExplanationSubmit = async () => {
    try {
      setExplanationLoading(true);
      if (!userName) {
        setError('Por favor, ingresa tu nombre para continuar');
        return;
      }

      // Format verses as "Book Chapter:Verse"
      const formattedVerses = selectedVerses.map(verse => 
        `${decodeBookName(selectedBook)} ${selectedChapter}:${verse}`
      );

      // Get verse texts if available
      const verseTexts = selectedVerses.map(verse => 
        currentChapter[verse - 1]
      );

      const result = await getVerseExplanationMultiple(formattedVerses, userName, verseTexts);
      setResponse(result.explanation);
    } catch (error) {
      //console.error('Error getting verse explanation:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Rate limit exceeded')) {
          setRateLimitInfo({
            remainingTime: '24 horas',
            endpoint: 'verseExplanation'
          });
          setShowRateLimitAlert(true);
        } else {
          setResponse('Lo siento, hubo un error al obtener la explicación. Por favor, intenta de nuevo.');
        }
      }
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - box.left,
      y: e.clientY - box.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleShare = async () => {
    if (!response) return;

    const shareText = `📖 Explicación de ${decodeBookName(selectedBook)} ${selectedChapter}:${selectedVerses.join(', ')}\n\n${response}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Explicación Bíblica',
          text: shareText
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareText);
        alert(t('bible.copied'));
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>{t('bible.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showWelcomeToast && (
        <Toast
          message={t('bible.welcomeToast')}
          onClose={() => setShowWelcomeToast(false)}
        />
      )}
      <div className={styles.content}>
        <div className={styles.controls}>
          <div className={styles.selectGroup}>
            <label htmlFor="bookSelect">{t('bible.book')}:</label>
            <select 
              id="bookSelect"
              value={selectedBook} 
              onChange={handleBookChange}
              className={styles.select}
              disabled={loading || error !== null}
            >
              {bibleData.map((book) => (
                <option key={book.abbrev} value={book.abbrev}>
                  {decodeBookName(book.abbrev)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.selectGroup}>
            <label htmlFor="chapterSelect">{t('bible.chapter')}:</label>
            <select 
              id="chapterSelect"
              value={selectedChapter} 
              onChange={handleChapterChange}
              className={styles.select}
              disabled={loading || error !== null || !currentBook}
            >
              {currentBook?.chapters.map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tools}>
            <button 
              className={styles.toolButton}
              onClick={() => setShowSearch(!showSearch)}
              title={t('bible.search')}
              disabled={loading || error !== null}
            >
              🔍
            </button>
            <button 
              className={styles.toolButton}
              onClick={() => handleZoom(2)}
              title={t('bible.increaseText')}
              disabled={loading || error !== null}
            >
              A+
            </button>
            <button 
              className={styles.toolButton}
              onClick={() => handleZoom(-2)}
              title={t('bible.decreaseText')}
              disabled={loading || error !== null}
            >
              A-
            </button>
          </div>
        </div>

        <div className={styles.chapterHeader}>
          <h2>{decodeBookName(selectedBook)}</h2>
          <h3>Capítulo {selectedChapter}</h3>
        </div>
        
        <div className={styles.verses} style={{ fontSize: `${fontSize}px` }}>
          {currentChapter.map((verse, index) => {
            const verseNumber = index + 1;
            return (
              <div 
                key={index} 
                className={`${styles.verse} ${selectedVerses.includes(verseNumber) ? styles.selectedVerse : ''}`}
                onClick={(event) => handleVerseClick(verseNumber, event)}
              >
                <span className={styles.verseNumber}>{verseNumber}</span>
                <span className={styles.verseText}>{verse}</span>
              </div>
            );
          })}
        </div>

        {selectedVerses.length > 0 && !showExplanation && (
          <div className={styles.selectionInfo}>
            <button onClick={() => setShowExplanation(true)}>
              {t('bible.writeExplanation')}
            </button>
          </div>
        )}

        {showExplanation && (
          <div 
            className={styles.explanationBox}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`
            }}
            onMouseDown={handleMouseDown}
          >
            {!response ? (
              <>
                <div className={styles.explanationActions}>
                  <button 
                    className={styles.explanationButton}
                    onClick={handleExplanationSubmit}
                    disabled={explanationLoading}
                  >
                    {explanationLoading ? (
                      <div className={styles.loadingSpinner}></div>
                    ) : (
                      t('bible.getExplanation')
                    )}
                  </button>
                  <button 
                    className={styles.explanationButton}
                    onClick={() => {
                      setSelectedVerses([]);
                      setShowExplanation(false);
                      setExplanation('');
                      setResponse(null);
                      setPosition({ x: 0, y: 0 });
                    }}
                    disabled={explanationLoading}
                  >
                    {t('bible.cancel')}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.responseContainer}>
                <div className={styles.responseText}>{cleanText(response)}</div>
                <div className={styles.explanationActions}>
                  <button 
                    className={styles.explanationButton}
                    onClick={handleShare}
                  >
                    {t('bible.share')}
                  </button>
                  <button 
                    className={styles.explanationButton}
                    onClick={() => {
                      setSelectedVerses([]);
                      setShowExplanation(false);
                      setExplanation('');
                      setResponse(null);
                      setPosition({ x: 0, y: 0 });
                    }}
                  >
                    {t('bible.close')}
                  </button>
                </div>
                <div className={styles.speakButtonContainer}>
                  <MuteButton 
                    isSpeaking={isSpeaking}
                    onToggle={() => {
                      if (isSpeaking) {
                        stop();
                      } else {
                        speak(cleanText(response));
                      }
                    }}
                    className={styles.speakButton}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showSearch && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('bible.searchPlaceholder')}
              className={styles.searchInput}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={styles.searchResult}
                    onClick={() => {
                      const bookAbbrev = Object.entries(bookNames).find(([_, name]) => name === result.book)?.[0] || 'gn';
                      setSelectedBook(bookAbbrev);
                      setSelectedChapter(result.chapter);
                      setSelectedVerses([result.verse]);
                      setShowSearch(false);
                    }}
                  >
                    <strong>{decodeBookName(result.book)} {result.chapter}:{result.verse}</strong>
                    <p>{result.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showRateLimitAlert && (
        <RateLimitAlert
          showRateLimitAlert={showRateLimitAlert}
          rateLimitInfo={rateLimitInfo}
          onClose={() => {
            setShowRateLimitAlert(false);
            setRateLimitInfo(null);
          }}
        />
      )}
    </div>
  );
} 