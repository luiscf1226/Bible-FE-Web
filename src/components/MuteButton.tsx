// MuteButton.tsx
import styles from './MuteButton.module.css';
import { useEffect, useRef } from 'react';

interface MuteButtonProps {
  isSpeaking: boolean;
  onToggle: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const MuteButton: React.FC<MuteButtonProps> = ({
  isSpeaking,
  onToggle,
  className = '',
  style
}) => {
  // Use ref to track if we should cleanup on unmount
  const shouldCleanupRef = useRef(false);

  // Only cleanup when component unmounts, not on re-renders
  useEffect(() => {
    shouldCleanupRef.current = isSpeaking;
    
    return () => {
      // Only stop if we were speaking when component unmounts
      if (shouldCleanupRef.current) {
        onToggle();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Update the ref when speaking state changes, but don't trigger cleanup
  useEffect(() => {
    shouldCleanupRef.current = isSpeaking;
  }, [isSpeaking]);

  return (
    <button
      className={`${styles.speakButton} ${className} ${isSpeaking ? styles.speaking : ''}`}
      onClick={onToggle}
      title={isSpeaking ? "Detener audio" : "Escuchar audio"}
      aria-label={isSpeaking ? "Detener audio" : "Escuchar audio"}
      aria-pressed={isSpeaking}
      style={style}
    >
      <span className={styles.icon}>
        {isSpeaking ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="12" height="16" rx="2" ry="2"/>
            <line x1="6" y1="8" x2="18" y2="8"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="6" y1="16" x2="18" y2="16"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        )}
      </span>
      <span className={styles.text}>{isSpeaking ? 'Detener' : 'Escuchar'}</span>
    </button>
  );
};

export default MuteButton;