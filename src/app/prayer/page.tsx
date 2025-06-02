"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './prayer.module.css';
import SpeechSynthesis from '@/components/SpeechSynthesis';

export default function PrayerPage() {
  const [petition, setPetition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState<{
    text: string;
    verse: string;
    reference: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock response for now - will be replaced with actual API call
    setTimeout(() => {
      setGeneratedPrayer({
        text: "Querido Padre Celestial, te agradezco por este momento de comunión contigo. Te pido que bendigas a esta persona y le des la paz y fortaleza que necesita. Que tu amor y gracia la guíen en cada paso de su camino. En el nombre de Jesús, amén.",
        verse: "Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.",
        reference: "Mateo 18:20"
      });
      setIsLoading(false);
    }, 1500);
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
            Comparte tu petición y recibe una oración personalizada junto con un versículo bíblico que te inspire.
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
                onClick={() => handleSpeak(generatedPrayer.text)}
                title="Escuchar oración"
              >
                🔊
              </button>
            </div>
            <div className={styles.prayerContent}>
              <p className={styles.prayerText}>{generatedPrayer.text}</p>
              <div className={styles.verseContainer}>
                <span className={styles.verseIcon}>📖</span>
                <p className={styles.verseText}>{generatedPrayer.verse}</p>
                <p className={styles.verseReference}>- {generatedPrayer.reference}</p>
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