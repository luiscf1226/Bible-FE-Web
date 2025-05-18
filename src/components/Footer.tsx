"use client";
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
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
              <li><a href="/" className={styles.footerLink}>Inicio</a></li>
              <li><a href="/bible" className={styles.footerLink}>Biblia</a></li>
              <li><a href="/emotions" className={styles.footerLink}>Emociones</a></li>
              <li><a href="/characters" className={styles.footerLink}>Personajes</a></li>
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