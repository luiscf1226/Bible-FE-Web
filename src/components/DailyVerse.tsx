// DailyVerse.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './DailyVerse.module.css';
import { useSpeechSynthesis } from './SpeechSynthesis';
import MuteButton from './MuteButton';
import { usePathname } from 'next/navigation';
import Toast from '@/components/Toast';

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

const DailyVerse: React.FC<DailyVerseProps> = ({ bibleData }) => {
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

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

  useEffect(() => {
    const loadDailyVerse = () => {
      const storedVerse = localStorage.getItem('dailyVerse');
      const storedDate = localStorage.getItem('dailyVerseDate');
      const today = new Date().toDateString();

      if (storedVerse && storedDate === today) {
        setDailyVerse(JSON.parse(storedVerse));
      } else {
        const newVerse = getRandomVerse();
        localStorage.setItem('dailyVerse', JSON.stringify(newVerse));
        localStorage.setItem('dailyVerseDate', today);
        setDailyVerse(newVerse);
      }
      setLoading(false);
      setShowToast(true);
    };

    if (bibleData.length > 0) {
      loadDailyVerse();
    }
  }, [bibleData]);

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
          <h2>Versículo del Día</h2>
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