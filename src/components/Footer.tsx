"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Footer.module.css';

const Footer = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleCharactersNavigation = () => {
    router.push('/?view=characters');
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>SoulVerse</h3>
            <p className={styles.footerDescription}>
              Un espacio para conectar con las Sagradas Escrituras y encontrar paz espiritual.
            </p>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.footerSubtitle}>Enlaces Rápidos</h4>
            <ul className={styles.footerLinks}>
              <li>
                <button onClick={() => handleNavigation('/')} className={styles.footerLink}>
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/bible')} className={styles.footerLink}>
                  Biblia
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/chat')} className={styles.footerLink}>
                  Emociones
                </button>
              </li>
              <li>
                <button onClick={handleCharactersNavigation} className={styles.footerLink}>
                  Personajes
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/prayer')} className={styles.footerLink}>
                  Oración
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} SoulVerse. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 