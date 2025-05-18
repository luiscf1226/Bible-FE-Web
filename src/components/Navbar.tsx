"use client";
import React from 'react';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          SoulVerse
        </div>
        <div className={styles.navLinks}>
          <a href="/" className={styles.navLink}>Inicio</a>
          <a href="/bible" className={styles.navLink}>Biblia</a>
          <a href="/emotions" className={styles.navLink}>Emociones</a>
          <a href="/characters" className={styles.navLink}>Personajes</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 