"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './prayer.module.css';
import SpeechSynthesis from '@/components/SpeechSynthesis';
import { generatePrayer } from '@/services/prayer';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';

export default function PrayerPage() {
  const [petition, setPetition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrayer, setGeneratedPrayer] = useState<{
    prayer: string;
    bible_verses: string[];
    explanation: string;
  } | null>(null);
  const router = useRouter();
  const { userName } = useUserName();
  const { checkEndpointLimit } = useRateLimit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!userName) {
      setError('Por favor, establece tu nombre antes de generar una oración');
      setIsLoading(false);
      return;
    }

    try {
      const { isLimited, remainingTime } = checkEndpointLimit('prayer');
      if (isLimited) {
        setError(`Límite de solicitudes alcanzado. Por favor, intenta de nuevo en ${remainingTime}`);
        setIsLoading(false);
        return;
      }

      const response = await generatePrayer(petition, userName);
      setGeneratedPrayer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la oración');
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          ← Volver
        </button>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <img src="/praying.png" alt="Icono de oración" />
          </div>
          <h1>Tiempo de Oración</h1>
          <p className={styles.subtitle}>
            Comparte tu petición y recibe una oración personalizada junto con versículos bíblicos que te inspiren.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.quoteCard}>
          <p className={styles.quoteText}>
            "Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos."
          </p>
          <p className={styles.quoteReference}>- Mateo 18:20</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>
              <span className={styles.labelIcon}>✍️</span>
              Tu Petición de Oración
            </label>
            <textarea
              className={styles.textarea}
              value={petition}
              onChange={(e) => setPetition(e.target.value)}
              placeholder="Escribe tu petición aquí..."
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingButton}>
                <div className={styles.loadingSpinner} />
                Generando Oración...
              </div>
            ) : (
              <>
                <span className={styles.buttonIcon}>🙏</span>
                Generar Oración
              </>
            )}
          </button>
        </form>

        {generatedPrayer && (
          <div className={styles.prayerCard}>
            <div className={styles.prayerHeader}>
              <div className={styles.prayerTitle}>
                <span className={styles.prayerIcon}>✨</span>
                <h2>Tu Oración Personalizada</h2>
              </div>
              <button 
                className={styles.speakButton}
                onClick={() => handleSpeak(generatedPrayer.prayer)}
                title="Escuchar oración"
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
              <button className={styles.shareButton}>
                <span className={styles.shareIcon}>📤</span>
                Compartir Oración
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 