import React, { useState, useEffect, useCallback } from 'react';
import styles from './DailyVerse.module.css';
import { useSpeechSynthesis } from './SpeechSynthesis';
import MuteButton from './MuteButton';
import { usePathname } from 'next/navigation';

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
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const pathname = usePathname();

  // Handle navigation events
  useEffect(() => {
    const handleRouteChange = () => {
      if (isSpeaking) {
        stop();
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (isSpeaking) {
        stop();
      }
    };
  }, [isSpeaking, stop]);

  // Stop speaking when pathname changes
  useEffect(() => {
    if (isSpeaking) {
      stop();
    }
  }, [pathname, isSpeaking, stop]);

  const handleToggleSpeech = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else if (dailyVerse?.text) {
      speak(dailyVerse.text);
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