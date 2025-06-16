import BiblicalCharacterCard from './BiblicalCharacterCard';
import styles from './BiblicalCharactersGrid.module.css';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

type CharacterTheme = 'jesus' | 'moises' | 'david' | 'maria' | 'pablo' | 'abraham';

interface BiblicalCharacter {
  name: string;
  description: string;
  imageUrl: string;
  theme: CharacterTheme;
}

export default function BiblicalCharactersGrid() {
  const router = useRouter();
  const { t } = useTranslation();

  const biblicalCharacters = [
  {
      name: t('chatCharacter.characters.jesus.name'),
      description: t('chatCharacter.characters.jesus.description'),
    imageUrl: '/images/characters/jesus.avif',
      theme: 'jesus' as CharacterTheme
  },
  {
      name: t('chatCharacter.characters.moises.name'),
      description: t('chatCharacter.characters.moises.description'),
    imageUrl: '/images/characters/moises.avif',
      theme: 'moises' as CharacterTheme
  },
  {
      name: t('chatCharacter.characters.david.name'),
      description: t('chatCharacter.characters.david.description'),
    imageUrl: '/images/characters/david.jpg',
      theme: 'david' as CharacterTheme
  },
  {
      name: t('chatCharacter.characters.maria.name'),
      description: t('chatCharacter.characters.maria.description'),
    imageUrl: '/images/characters/maria.jpg',
      theme: 'maria' as CharacterTheme
  },
  {
      name: t('chatCharacter.characters.pablo.name'),
      description: t('chatCharacter.characters.pablo.description'),
    imageUrl: '/images/characters/pablo.avif',
      theme: 'pablo' as CharacterTheme
  },
  {
      name: t('chatCharacter.characters.abraham.name'),
      description: t('chatCharacter.characters.abraham.description'),
    imageUrl: '/images/characters/abraham.jpg',
      theme: 'abraham' as CharacterTheme
  }
];

  const handleChat = (characterName: string) => {
    const characterId = characterName.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
    router.push(`/chat/${characterId}`);
  };

  return (
    <div className={styles.gridContainer}>
      <h2 className={styles.title}>{t('biblicalCharactersGrid.title')}</h2>
      <div className={styles.grid}>
        {biblicalCharacters.map((character) => (
          <BiblicalCharacterCard
            key={character.name}
            name={character.name}
            description={character.description}
            imageUrl={character.imageUrl}
            onChat={() => handleChat(character.name)}
            theme={character.theme}
          />
        ))}
      </div>
    </div>
  );
} 