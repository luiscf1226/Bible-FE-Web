'use client';

import { useState } from 'react';
import styles from './FeelingSelector.module.css';

interface FeelingSelectorProps {
  selectedFeeling: string;
  onFeelingSelect: (feeling: string) => void;
}

const feelings = [
  { id: 'happy', label: '😊 Feliz', color: '#FFD700' },
  { id: 'sad', label: '😢 Triste', color: '#4682B4' },
  { id: 'angry', label: '😠 Enojado', color: '#FF4500' },
  { id: 'anxious', label: '😰 Ansioso', color: '#9370DB' },
  { id: 'peaceful', label: '😌 Tranquilo', color: '#98FB98' },
  { id: 'excited', label: '🤩 Emocionado', color: '#FF69B4' },
];

export default function FeelingSelector({ selectedFeeling, onFeelingSelect }: FeelingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div 
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedFeeling ? (
          <span className={styles.selectedFeeling}>
            {feelings.find(f => f.id === selectedFeeling)?.label}
          </span>
        ) : (
          <span className={styles.placeholder}>Selecciona cómo te sientes</span>
        )}
        <span className={styles.arrow}>▼</span>
      </div>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {feelings.map((feeling) => (
            <div
              key={feeling.id}
              className={styles.option}
              style={{ backgroundColor: feeling.color + '20' }}
              onClick={() => {
                onFeelingSelect(feeling.id);
                setIsOpen(false);
              }}
            >
              {feeling.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 