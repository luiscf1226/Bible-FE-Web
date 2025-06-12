import React from 'react';
import styles from './ErrorPage.module.css';
import Link from 'next/link';

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, reset }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorTitle}>¡Ups! Algo salió mal</h1>
        <p className={styles.errorMessage}>
          {error?.message || 'Ha ocurrido un error inesperado'}
        </p>
        <div className={styles.errorActions}>
          <button onClick={reset} className={styles.retryButton}>
            Intentar de nuevo
          </button>
          <Link href="/" className={styles.homeButton}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 