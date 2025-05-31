"use client";
import React, { useState, useEffect } from 'react';
import styles from './NameInput.module.css';

interface NameInputProps {
  onNameSubmit: (name: string) => void;
}

export default function NameInput({ onNameSubmit }: NameInputProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsSubmitting(true);
      // Add a small delay for the animation
      setTimeout(() => {
        onNameSubmit(name.trim());
        setIsSubmitting(false);
      }, 500);
    }
  };

  return (
    <div className={styles.nameInputOverlay}>
      <div className={styles.nameInputContainer}>
        <div className={styles.nameInputContent}>
          <h2 className={styles.title}>Bienvenido a SoulVerse</h2>
          <p className={styles.subtitle}>
            Para comenzar, por favor ingresa tu nombre
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={styles.input}
                required
                minLength={2}
                maxLength={30}
              />
              <div className={styles.inputBorder} />
            </div>
            <button 
              type="submit" 
              className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Guardando...' : 'Comenzar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 