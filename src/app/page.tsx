"use client";
import React, { useState, useEffect } from 'react';
import SoulCard from '@/components/SoulCard';
import BiblicalCharactersGrid from '@/components/BiblicalCharactersGrid';
import styles from './home.module.css';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SoulVerseDashboard() {
  const [showCharacters, setShowCharacters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const view = searchParams.get('view');
    setShowCharacters(view === 'characters');
  }, [searchParams]);

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        <main className={styles.mainContent}>
          {!showCharacters ? (
            <>
              <div className={styles.heroSection}>
                <h2 className={styles.mainHeading}>Bienvenido a SoulVerse</h2>
                <p className={styles.subheading}>
                  Un espacio para conectar con las Sagradas Escrituras, explorar tus emociones y recibir guía espiritual.
                </p>
              </div>
              
              <div className={`${styles.cardsContainer} grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center`}>
                <SoulCard
                  headerColor=""
                  icon={<img src="/read.png" alt="Bible Icon" />}
                  title="Leer la Biblia"
                  titleColor="var(--color-text-on-dark)"
                  description="Explora las escrituras, busca versículos y recibe explicaciones profundas."
                  buttonText=""
                  buttonColor=""
                  buttonHoverColor=""
                  isReferenceDesign={true}
                  cardStyle="bible"
                  onClick={() => router.push('/bible')}
                />
                
                <SoulCard
                  headerColor=""
                  icon={<img src="/feelings.png" alt="Feelings Icon" />}
                  title="¿Cómo Te Sientes?"
                  titleColor="var(--color-text-on-dark)"
                  description="Comparte tus emociones y recibe versículos, reflexiones y oraciones personalizadas."
                  buttonText=""
                  buttonColor=""
                  buttonHoverColor=""
                  isReferenceDesign={true}
                  cardStyle="emotion"
                  onClick={() => router.push('/chat')}
                />
                
                <SoulCard
                  headerColor=""
                  icon={<img src="/character.png" alt="Character Icon" />}
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
              </div>
              
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