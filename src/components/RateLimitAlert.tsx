"use client";
import React from 'react';
import styles from './RateLimitAlert.module.css';

interface RateLimitInfo {
  remainingTime: string;
  endpoint: string;
}

interface RateLimitAlertProps {
  showRateLimitAlert: boolean;
  rateLimitInfo: RateLimitInfo | null;
  onClose: () => void;
}

export default function RateLimitAlert({ 
  showRateLimitAlert, 
  rateLimitInfo, 
  onClose 
}: RateLimitAlertProps) {
  if (!showRateLimitAlert) return null;

  const getEndpointName = (endpoint: string) => {
    switch (endpoint) {
      case 'verseExplanation':
        return 'explicaciones de versículos';
      case 'characterChat':
        return 'chats con personajes';
      case 'feelingChat':
        return 'chats de emociones';
      default:
        return 'este servicio';
    }
  };

  return (
    <div className={styles.rateLimitAlert}>
      <div className={styles.rateLimitContent}>
        <h3>Límite de uso alcanzado</h3>
        <p>
          Has alcanzado el límite de 5 {rateLimitInfo && getEndpointName(rateLimitInfo.endpoint)} por 24 horas. 
          {rateLimitInfo && (
            <>
              <br />
              Tiempo restante: {rateLimitInfo.remainingTime}
            </>
          )}
        </p>
        <p>
          Para continuar usando el servicio sin límites, puedes:
          <br />
          1. Esperar 24 horas para que se reinicie tu límite
          <br />
          2. Contactar con nosotros para obtener acceso completo
        </p>
        <button 
          className={styles.rateLimitButton}
          onClick={onClose}
        >
          Entendido
        </button>
      </div>
    </div>
  );
} 