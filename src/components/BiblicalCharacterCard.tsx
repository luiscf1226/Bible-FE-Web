import Image from 'next/image';
import styles from './BiblicalCharacterCard.module.css';

interface BiblicalCharacterProps {
  name: string;
  description: string;
  imageUrl: string;
  onChat: () => void;
  theme?: 'jesus' | 'moises' | 'david' | 'maria' | 'pablo' | 'abraham';
}

const themeColors = {
  jesus: {
    gradient: 'linear-gradient(135deg, #2c5282 0%, #1a365d 100%)',
    buttonGradient: 'linear-gradient(90deg, #2c5282, #1a365d)'
  },
  moises: {
    gradient: 'linear-gradient(135deg, #2c7a7b 0%, #234e52 100%)',
    buttonGradient: 'linear-gradient(90deg, #2c7a7b, #234e52)'
  },
  david: {
    gradient: 'linear-gradient(135deg, #553c9a 0%, #44337a 100%)',
    buttonGradient: 'linear-gradient(90deg, #553c9a, #44337a)'
  },
  maria: {
    gradient: 'linear-gradient(135deg, #9b2c2c 0%, #742a2a 100%)',
    buttonGradient: 'linear-gradient(90deg, #9b2c2c, #742a2a)'
  },
  pablo: {
    gradient: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    buttonGradient: 'linear-gradient(90deg, #2d3748, #1a202c)'
  },
  abraham: {
    gradient: 'linear-gradient(135deg, #744210 0%, #5c3410 100%)',
    buttonGradient: 'linear-gradient(90deg, #744210, #5c3410)'
  }
};

export default function BiblicalCharacterCard({ 
  name, 
  description, 
  imageUrl, 
  onChat,
  theme = 'jesus'
}: BiblicalCharacterProps) {
  const colors = themeColors[theme];

  return (
    <div 
      className={styles.characterCard}
      style={{ background: colors.gradient }}
      onClick={onChat}
    >
      <div className={styles.imageContainer}>
        <Image
          src={imageUrl}
          alt={name}
          width={200}
          height={200}
          className={styles.characterImage}
          priority
          quality={100}
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/characters/default.jpg';
          }}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
} 