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
  return (
    <button
      className={`${styles.speakButton} ${className} ${isSpeaking ? styles.speaking : ''}`}
      onClick={onToggle}
      title={isSpeaking ? "Detener" : "Escuchar"}
    >
      {isSpeaking ? 'Detener' : 'Escuchar'}
    </button>
  );
};

export default MuteButton; 