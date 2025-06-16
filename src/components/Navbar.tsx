"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

const Navbar = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (dropdownOpen || menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, menuOpen]);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

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
        <div className={styles.spacer} />
        <div className={styles.languageDropdownWrapper} ref={dropdownRef}>
          <button
            className={styles.languageSwitcher}
            onClick={() => setDropdownOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={t('language')}
            type="button"
          >
            <span className={styles.languageIcon}>
              {languages.find(l => l.code === language)?.flag}
            </span>
            <span className={styles.languageText}>
              {languages.find(l => l.code === language)?.label}
            </span>
            <svg className={styles.languageChevron} width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {dropdownOpen && (
            <ul className={styles.languageDropdown} role="listbox">
              {languages.map((lang) => (
                <li key={lang.code} role="option" aria-selected={language === lang.code}>
                  <button
                    className={styles.languageDropdownItem}
                    onClick={() => {
                      setLanguage(lang.code as 'en' | 'es');
                      setDropdownOpen(false);
                    }}
                    disabled={language === lang.code}
                  >
                    <span className={styles.languageIcon}>{lang.flag}</span>
                    <span className={styles.languageText}>{lang.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className={styles.hamburger}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span className={styles.hamburgerBar}></span>
          <span className={styles.hamburgerBar}></span>
          <span className={styles.hamburgerBar}></span>
        </button>
        <div
          className={menuOpen ? styles.mobileMenuOpen : styles.mobileMenu}
          id="mobile-menu"
          ref={menuRef}
          role="menu"
        >
          <button onClick={handleHomeNavigation} className={styles.mobileNavLink}>{t('navbar.home')}</button>
          <button onClick={() => handleNavigation('/bible')} className={styles.mobileNavLink}>{t('navbar.bible')}</button>
          <button onClick={() => handleNavigation('/chat')} className={styles.mobileNavLink}>{t('navbar.emotions')}</button>
          <button onClick={handleCharactersNavigation} className={styles.mobileNavLink}>{t('navbar.characters')}</button>
        </div>
        <div className={styles.navLinks}>
          <button onClick={handleHomeNavigation} className={styles.navLink}>{t('navbar.home')}</button>
          <button onClick={() => handleNavigation('/bible')} className={styles.navLink}>{t('navbar.bible')}</button>
          <button onClick={() => handleNavigation('/chat')} className={styles.navLink}>{t('navbar.emotions')}</button>
          <button onClick={handleCharactersNavigation} className={styles.navLink}>{t('navbar.characters')}</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 