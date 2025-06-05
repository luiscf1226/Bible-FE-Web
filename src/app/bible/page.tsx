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

interface BibleVerse {
  abbrev: string;
  chapters: string[][];
}

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

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/assets/es_rvr.json');
        if (!response.ok) {
          throw new Error('Failed to load Bible data');
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid Bible data format');
        }
        setBibleData(data);
        // Log all unique abbreviations for mapping validation
        const abbrevs = data.map((book: any) => book.abbrev);
        //console.log('Bible abbreviations:', abbrevs);
      } catch (error) {
        console.error('Error loading Bible data:', error);
        setError('Error loading Bible data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBibleData();
  }, []);

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

  const handleVerseClick = (verseNumber: number) => {
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
          setShowToast(true);
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

      // Speak the explanation
      stop(); // Stop any ongoing speech
      setTimeout(() => {
        speak(result.explanation);
      }, 100);
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando la Biblia...</p>
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
          message="Selecciona los versículos que quieras entender mejor..."
          onClose={() => setShowWelcomeToast(false)}
        />
      )}
      {showToast && selectedVerses.length > 0 && (
        <Toast
          message="Haz clic en 'Escribir explicación' para obtener una explicación de los versículos seleccionados..."
          onClose={() => setShowToast(false)}
        />
      )}
      <div className={styles.content}>
        <div className={styles.controls}>
          <div className={styles.selectGroup}>
            <label htmlFor="bookSelect">Libro:</label>
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
            <label htmlFor="chapterSelect">Capítulo:</label>
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
              title="Buscar"
              disabled={loading || error !== null}
            >
              🔍
            </button>
            <button 
              className={styles.toolButton}
              onClick={() => handleZoom(2)}
              title="Aumentar texto"
              disabled={loading || error !== null}
            >
              A+
            </button>
            <button 
              className={styles.toolButton}
              onClick={() => handleZoom(-2)}
              title="Reducir texto"
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
                onClick={() => handleVerseClick(verseNumber)}
              >
                <span className={styles.verseNumber}>{verseNumber}</span>
                <span className={styles.verseText}>{verse}</span>
              </div>
            );
          })}
        </div>

        {selectedVerses.length > 0 && !showExplanation && (
          <div className={styles.selectionInfo}>
            <span>
              {selectedVerses.length} versículo{selectedVerses.length !== 1 ? 's' : ''} seleccionado{selectedVerses.length !== 1 ? 's' : ''}
              {selectedVerses.length > 0 && ` (${selectedVerses.join(', ')})`}
            </span>
            <button onClick={() => setShowExplanation(true)}>
              Escribir explicación
            </button>
          </div>
        )}

        {showExplanation && (
          <div 
            className={styles.explanationBox}
            style={{
              transform: 'none',
              left: position.x,
              top: position.y,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className={styles.selectedVersesInfo}>
              <span>Versículos seleccionados: {selectedVerses.join(', ')}</span>
            </div>
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
                      'Obtener Explicación'
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
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.responseContainer}>
                <div className={styles.responseText}>{response}</div>
                <div className={styles.explanationActions}>
                  <MuteButton 
                    isSpeaking={isSpeaking}
                    onToggle={() => isSpeaking ? stop() : speak(response)}
                    className={styles.speakButton}
                  />
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
                    Cerrar
                  </button>
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
              placeholder="Buscar en la Biblia..."
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