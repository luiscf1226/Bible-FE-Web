import React, { useState, useEffect } from 'react';
import styles from './DailyVerse.module.css';
import { useSpeechSynthesis } from './SpeechSynthesis';

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

  const handleSpeak = () => {
    if (dailyVerse) {
      if (isSpeaking) {
        stop();
      } else {
        speak(dailyVerse.text);
      }
    }
  };

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
          <button 
            className={styles.speakButton}
            onClick={handleSpeak}
            title={isSpeaking ? "Detener" : "Escuchar"}
          >
            {isSpeaking ? "🔇" : "🔊"}
          </button>
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