"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './prayer.module.css';
import SpeechSynthesis from '@/components/SpeechSynthesis';
import { generatePrayer } from '@/services/prayer';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';
import SpeechRecognitionComponent from '@/components/SpeechRecognition';
import { useTranslation } from '@/hooks/useTranslation';

// Add type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export default function PrayerPage() {
  const [petition, setPetition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [generatedPrayer, setGeneratedPrayer] = useState<{
    prayer: string;
    bible_verses: string[];
    explanation: string;
  } | null>(null);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();
  const { userName } = useUserName();
  const { checkEndpointLimit } = useRateLimit();
  const { t } = useTranslation();

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
    setPetition(newTranscript);
  };

  const handleRecordingComplete = (finalTranscript: string) => {
    setTranscript(finalTranscript);
    setPetition(finalTranscript);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!userName) {
      setError(t('prayer.errorNoName'));
      setIsLoading(false);
      return;
    }

    try {
      const { isLimited, remainingTime } = checkEndpointLimit('prayer');
      if (isLimited) {
        setError(t('prayer.errorLimit', { remainingTime: remainingTime ?? '' }));
        setIsLoading(false);
        return;
      }

      const response = await generatePrayer(petition, userName);
      setGeneratedPrayer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = async () => {
    if (!generatedPrayer) return;

    const shareData = {
      title: t('prayer.shareTitle'),
      text: `${generatedPrayer.prayer}\n\n${t('prayer.bibleVerses')}\n${generatedPrayer.bible_verses.join('\n')}\n\n${t('prayer.explanation')}\n${generatedPrayer.explanation}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(shareData.text);
        showToast(t('prayer.shareCopied'), 'success');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(shareData.text);
        showToast(t('prayer.shareCopied'), 'success');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        showToast(t('prayer.shareFailed'), 'error');
      }
    }
  };

  return (
    <div className={styles.container}>
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '⚠️'}
          </span>
          {toast.message}
        </div>
      )}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          {t('prayer.back')}
        </button>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <img src="/praying.png" alt="Icono de oración" />
          </div>
          <h1>{t('prayer.title')}</h1>
          <p className={styles.subtitle}>
            {t('prayer.subtitle')}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.quoteCard}>
          <p className={styles.quoteText}>
            {t('prayer.quote')}
          </p>
          <p className={styles.quoteReference}>{t('prayer.quoteReference')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>
              <span className={styles.labelIcon}>✍️</span>
              {t('prayer.inputLabel')}
            </label>
            <div className={styles.textareaContainer}>
              <textarea
                className={styles.textarea}
                value={petition}
                onChange={(e) => setPetition(e.target.value)}
                placeholder={t('prayer.inputPlaceholder')}
                required
              />
              <SpeechRecognitionComponent
                onTranscriptChange={handleTranscriptChange}
                onRecordingComplete={handleRecordingComplete}
                className={styles.speechRecognition}
                theme={{
                  accent: 'rgba(255, 255, 255, 0.2)',
                  border: 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !petition.trim()}
          >
            {isLoading ? (
              <div className={styles.loadingButton}>
                <div className={styles.loadingSpinner} />
                {t('prayer.generating')}
              </div>
            ) : (
              <>
                <span className={styles.buttonIcon}>🙏</span>
                {t('prayer.generateButton')}
              </>
            )}
          </button>
        </form>

        {generatedPrayer && (
          <div className={styles.prayerCard}>
            <div className={styles.prayerHeader}>
              <div className={styles.prayerTitle}>
                <span className={styles.prayerIcon}>✨</span>
                <h2>{t('prayer.personalizedTitle')}</h2>
              </div>
              <button 
                className={styles.speakButton}
                onClick={() => handleSpeak(generatedPrayer.prayer)}
                title={t('prayer.listen')}
              >
                🔊
              </button>
            </div>
            <div className={styles.prayerContent}>
              <p className={styles.prayerText}>{generatedPrayer.prayer}</p>
              <div className={styles.verseContainer}>
                <span className={styles.verseIcon}>📖</span>
                <div className={styles.versesList}>
                  {generatedPrayer.bible_verses.map((verse, index) => (
                    <p key={index} className={styles.verseText}>{verse}</p>
                  ))}
                </div>
              </div>
              <div className={styles.explanationContainer}>
                <span className={styles.explanationIcon}>💭</span>
                <p className={styles.explanationText}>{generatedPrayer.explanation}</p>
              </div>
            </div>
            <div className={styles.prayerFooter}>
              <button 
                className={styles.shareButton}
                onClick={handleShare}
                title={t('prayer.share')}
              >
                <span className={styles.shareIcon}>📤</span>
                {t('prayer.share')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 