"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

const Navbar = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleCharactersNavigation = () => {
    router.push('/?view=characters');
  };

  const handleHomeNavigation = () => {
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo} onClick={handleHomeNavigation}>
          SoulVerse
        </div>
        <div className={styles.navLinks}>
          <button onClick={handleHomeNavigation} className={styles.navLink}>Inicio</button>
          <button onClick={() => handleNavigation('/bible')} className={styles.navLink}>Biblia</button>
          <button onClick={() => handleNavigation('/chat')} className={styles.navLink}>Emociones</button>
          <button onClick={handleCharactersNavigation} className={styles.navLink}>Personajes</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 