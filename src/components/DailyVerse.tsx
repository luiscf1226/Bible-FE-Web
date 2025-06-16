// DailyVerse.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './DailyVerse.module.css';
import { useSpeechSynthesis } from './SpeechSynthesis';
import MuteButton from './MuteButton';
import { usePathname } from 'next/navigation';
import Toast from '@/components/Toast';
import { useTranslation } from '@/hooks/useTranslation';

interface DailyVerseProps {
  bibleData: Array<{
    abbrev: string;
    chapters: string[][];
  }>;
}

interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const DailyVerse: React.FC = () => {
  const [bibleData, setBibleData] = useState<Array<{ abbrev: string; chapters: string[][] }>>([]);
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const { t, language } = useTranslation();

  // Load Bible data based on language
  useEffect(() => {
    const loadBibleData = async () => {
      setLoading(true);
      let file = '/assets/es_rvr.json';
      if (language === 'en') file = '/assets/en_bbe.json';
      const response = await fetch(file);
      const data = await response.json();
      setBibleData(data);
      setLoading(false);
    };
    loadBibleData();
  }, [language]);

  // Handle navigation events - only stop when pathname actually changes
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      if (isSpeaking) {
        console.log('Pathname changed, stopping speech');
        stop();
      }
      previousPathnameRef.current = pathname;
    }
  }, [pathname, isSpeaking, stop]);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handleRouteChange = () => {
      if (isSpeaking) {
        console.log('Browser navigation detected, stopping speech');
        stop();
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isSpeaking, stop]);

  const handleToggleSpeech = useCallback(() => {
    console.log('Toggle speech clicked');
    console.log('Is speaking:', isSpeaking);
    console.log('Daily verse:', dailyVerse);
        
    if (isSpeaking) {
      console.log('Stopping speech...');
      stop();
    } else if (dailyVerse?.text) {
      console.log('Attempting to speak text:', dailyVerse.text);
      speak(dailyVerse.text, {
        onStart: () => console.log('Speech started'),
        onEnd: () => console.log('Speech ended'),
        onError: () => console.log('Speech error')
      });
    }
  }, [isSpeaking, stop, speak, dailyVerse]);

  const getRandomVerse = (): Verse => {
    // Get a random book
    const randomBook = bibleData[Math.floor(Math.random() * bibleData.length)];
        
    // Get a random chapter
    const randomChapterIndex = Math.floor(Math.random() * randomBook.chapters.length);
    const randomChapter = randomBook.chapters[randomChapterIndex];
        
    // Get a random verse
    const randomVerseIndex = Math.floor(Math.random() * randomChapter.length);
        
    return {
      book: randomBook.abbrev,
      chapter: randomChapterIndex + 1,
      verse: randomVerseIndex + 1,
      text: randomChapter[randomVerseIndex]
    };
  };

  // Use language-specific localStorage keys for daily verse
  useEffect(() => {
    const loadDailyVerse = () => {
      const verseKey = `dailyVerse_${language}`;
      const dateKey = `dailyVerseDate_${language}`;
      const storedVerse = localStorage.getItem(verseKey);
      const storedDate = localStorage.getItem(dateKey);
      const today = new Date().toDateString();

      if (storedVerse && storedDate === today) {
        setDailyVerse(JSON.parse(storedVerse));
      } else {
        const newVerse = getRandomVerse();
        localStorage.setItem(verseKey, JSON.stringify(newVerse));
        localStorage.setItem(dateKey, today);
        setDailyVerse(newVerse);
      }
      setLoading(false);
      setShowToast(true);
    };

    if (bibleData.length > 0) {
      loadDailyVerse();
    }
  }, [bibleData, language]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (!dailyVerse) {
    return null;
  }

  return (
    <div className={styles.dailyVerseContainer}>
      <div className={styles.dailyVerseCard}>
        <div className={styles.header}>
          <h2>{t('verseOfTheDay')}</h2>
          <MuteButton 
            isSpeaking={isSpeaking}
            onToggle={handleToggleSpeech}
            className={styles.speakButton}
          />
        </div>
        <div className={styles.verseContent}>
          <p className={styles.verseText}>{dailyVerse.text}</p>
          <p className={styles.verseReference}>
            {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyVerse;