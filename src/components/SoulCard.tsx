"use client";

import styles from './SoulCard.module.css';
import React, { ReactNode } from 'react';

interface SoulCardProps {
  headerColor: string;
  icon: ReactNode;
  title: string;
  titleColor: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  buttonHoverColor: string;
  isReferenceDesign?: boolean;
  cardStyle?: 'bible' | 'emotion' | 'character';
  onButtonClick?: () => void;
}

const SoulCard: React.FC<SoulCardProps> = ({
  headerColor,
  icon,
  title,
  titleColor,
  description,
  buttonText,
  buttonColor,
  buttonHoverColor,
  isReferenceDesign = false,
  cardStyle,
  onButtonClick,
}) => {
  if (isReferenceDesign) {
    const cardStyleClass = cardStyle 
      ? styles[`reference${cardStyle.charAt(0).toUpperCase() + cardStyle.slice(1)}`] 
      : '';

    return (
      <div className={`${styles.referenceCard} ${cardStyleClass}`}>
        <div className={styles.referenceIconContainer}>
          {icon}
        </div>
        <div className={styles.referenceContent}>
          <h2 className={styles.referenceTitle}>{title}</h2>
          <p className={styles.referenceDescription}>{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`soul-card w-full max-w-sm mx-auto ${styles.soulCard}`}
      style={{ ['--header-color' as any]: headerColor, ['--button-color' as any]: buttonColor, ['--button-hover-color' as any]: buttonHoverColor, ['--title-color' as any]: titleColor }}
    >
      <div className={`soul-card-header ${styles.header}`} />
      <div className="soul-card-body h-64 flex flex-col justify-between">
        <div className={`soul-icon-container ${styles.iconContainer} mb-4`}>
          <span className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 text-3xl md:text-2xl">
            {icon}
          </span>
        </div>
        <h2 className="title-medium mb-2" style={{ color: 'var(--title-color)' }}>
          {title}
        </h2>
        <p className="body-text text-center mb-6">
          {description}
        </p>
        {buttonText && (
          <button
            className={`btn-primary w-full ${styles.button}`}
            onClick={onButtonClick}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default SoulCard; 