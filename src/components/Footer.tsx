"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Footer.module.css';
import { useTranslation } from '@/hooks/useTranslation';

const Footer = () => {
  const router = useRouter();
  const { t } = useTranslation();

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
            <h3 className={styles.footerTitle}>{t('footer.soulverse')}</h3>
            <p className={styles.footerDescription}>
              {t('footer.description')}
            </p>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.footerSubtitle}>{t('footer.quickLinks')}</h4>
            <ul className={styles.footerLinks}>
              <li>
                <button onClick={() => handleNavigation('/')} className={styles.footerLink}>
                  {t('footer.home')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/bible')} className={styles.footerLink}>
                  {t('footer.bible')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/chat')} className={styles.footerLink}>
                  {t('footer.emotions')}
                </button>
              </li>
              <li>
                <button onClick={handleCharactersNavigation} className={styles.footerLink}>
                  {t('footer.characters')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/prayer')} className={styles.footerLink}>
                  {t('footer.prayer')}
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 