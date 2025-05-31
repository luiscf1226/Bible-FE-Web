import { useState } from 'react';
import styles from './MuteButton.module.css';

interface MuteButtonProps {
  isSpeaking: boolean;
  onToggle: () => void;
  className?: string;
}

export const MuteButton: React.FC<MuteButtonProps> = ({ 
  isSpeaking, 
  onToggle,
  className = ''
}) => {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggle = () => {
    setIsMuted(!isMuted);
    onToggle();
  };

  return (
    <button
      className={`${styles.muteButton} ${className}`}
      onClick={handleToggle}
      title={isMuted ? "Activar audio" : "Silenciar audio"}
    >
      {isMuted ? (
        <span className={styles.icon}>🔇</span>
      ) : (
        <span className={styles.icon}>{isSpeaking ? '🔊' : '🔈'}</span>
      )}
    </button>
  );
};

export default MuteButton; 