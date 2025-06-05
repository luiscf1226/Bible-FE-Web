"use client";
import React, { useState, useEffect, Suspense } from 'react';
import SoulCard from '@/components/SoulCard';
import BiblicalCharactersGrid from '@/components/BiblicalCharactersGrid';
import DailyVerse from '@/components/DailyVerse';
import styles from './home.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import ComingSoon from '@/components/ComingSoon';

interface BibleVerse {
  abbrev: string;
  chapters: string[][];
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-32">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}

function MainContent() {
  const [showCharacters, setShowCharacters] = useState(false);
  const [bibleData, setBibleData] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const view = searchParams.get('view');
    setShowCharacters(view === 'characters');
  }, [searchParams]);

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/assets/es_rvr.json');
        if (!response.ok) {
          throw new Error('Failed to load Bible data');
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid Bible data format');
        }
        setBibleData(data);
      } catch (error) {
        console.error('Error loading Bible data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBibleData();
  }, []);

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        <main className={styles.mainContent}>
          {!showCharacters ? (
            <>
              <div className={styles.heroSection}>
                <h2 className={styles.mainHeading}>Bienvenido a SoulVerse</h2>
                <p className={styles.subheading}>
                  Un espacio para conectar con la Palabra de Dios, explorar tus emociones y recibir guía espiritual.
                </p>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : bibleData.length > 0 ? (
                <DailyVerse bibleData={bibleData} />
              ) : null}

              {showComingSoon ? (
                <Suspense fallback={<LoadingSpinner />}>
                  <ComingSoon />
                </Suspense>
              ) : (
                <div className={`${styles.cardsContainer} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center`}>
                  <SoulCard
                    headerColor=""
                    icon={<img src="/read.png" alt="Bible Icon" className="w-full h-full object-contain" />}
                    title="Leer la Biblia"
                    titleColor="var(--color-text-on-dark)"
                    description="Explora las escrituras, selecciona versículos, busca referencias, selecciona un versículo y obtén una explicación detallada de cada pasaje."
                    buttonText=""
                    buttonColor=""
                    buttonHoverColor=""
                    isReferenceDesign={true}
                    cardStyle="bible"
                    onClick={() => router.push('/bible')}
                  />
                  <SoulCard
                    headerColor=""
                    icon={<img src="/feelings.png" alt="Feelings Icon" className="w-full h-full object-contain" />}
                    title="¿Cómo Te Sientes?"
                    titleColor="var(--color-text-on-dark)"
                    description="Escoje una emoción y recibe un versículo, reflexiones y oraciones personalizadas."
                    buttonText=""
                    buttonColor=""
                    buttonHoverColor=""
                    isReferenceDesign={true}
                    cardStyle="emotion"
                    onClick={() => router.push('/chat')}
                  />
                  <SoulCard
                    headerColor=""
                    icon={<img src="/character.png" alt="Character Icon" className="w-full h-full object-contain" />}
                    title="Habla con un Personaje Bíblico"
                    titleColor="var(--color-text-on-dark)"
                    description="Conversa con figuras bíblicas y recibe sabiduría desde su perspectiva espiritual."
                    buttonText=""
                    buttonColor=""
                    buttonHoverColor=""
                    isReferenceDesign={true}
                    cardStyle="character"
                    onClick={() => {
                      setShowCharacters(true);
                      router.push('/?view=characters');
                    }}
                  />
                  <SoulCard
                    headerColor=""
                    icon={<img src="/praying.png" alt="Prayer Icon" className="w-full h-full object-contain" />}
                    title="Tiempo de oración"
                    titleColor="var(--color-text-on-dark)"
                    description="Aquí puedes generar una oración personalizada según cómo te sientas hoy y presentar una petición especial."
                    buttonText=""
                    buttonColor=""
                    buttonHoverColor=""
                    isReferenceDesign={true}
                    cardStyle="emotion"
                    onClick={() => router.push('/prayer')}
                  />
                </div>
              )}
              <div className={styles.scriptureQuote}>
                <p>"Porque la palabra de Dios es viva y eficaz."<br />Hebreos 4:12</p>
              </div>
            </>
          ) : (
            <div className={styles.charactersSection}>
              <button 
                className={`${styles.backButton} mt-16`}
                onClick={() => {
                  setShowCharacters(false);
                  router.push('/');
                }}
              >
                ← Volver
              </button>
              <BiblicalCharactersGrid />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SoulVerseDashboard() {
  return (
    <Suspense fallback={
      <div className={styles.pageBackground}>
        <div className={styles.container}>
          <main className={styles.mainContent}>
            <div className={styles.heroSection}>
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </div>
    }>
      <MainContent />
    </Suspense>
  );
}