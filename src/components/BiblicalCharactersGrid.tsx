import BiblicalCharacterCard from './BiblicalCharacterCard';
import styles from './BiblicalCharactersGrid.module.css';
import { useRouter } from 'next/navigation';

type CharacterTheme = 'jesus' | 'moises' | 'david' | 'maria' | 'pablo' | 'abraham';

interface BiblicalCharacter {
  name: string;
  description: string;
  imageUrl: string;
  theme: CharacterTheme;
}

const biblicalCharacters: BiblicalCharacter[] = [
  {
    name: 'Jesús',
    description: 'El Hijo de Dios, Salvador y Maestro que enseñó el amor y la compasión.',
    imageUrl: '/images/characters/jesus.avif',
    theme: 'jesus'
  },
  {
    name: 'Moisés',
    description: 'Líder que liberó al pueblo de Israel y recibió los Diez Mandamientos.',
    imageUrl: '/images/characters/moises.avif',
    theme: 'moises'
  },
  {
    name: 'David',
    description: 'Rey de Israel, poeta y guerrero que escribió los Salmos.',
    imageUrl: '/images/characters/david.jpg',
    theme: 'david'
  },
  {
    name: 'María',
    description: 'Madre de Jesús, ejemplo de fe y humildad.',
    imageUrl: '/images/characters/maria.jpg',
    theme: 'maria'
  },
  {
    name: 'Pablo',
    description: 'Apóstol que difundió el mensaje de Cristo por el mundo antiguo.',
    imageUrl: '/images/characters/pablo.avif',
    theme: 'pablo'
  },
  {
    name: 'Abraham',
    description: 'Padre de la fe, fundador del pueblo de Dios.',
    imageUrl: '/images/characters/abraham.jpg',
    theme: 'abraham'
  }
];

export default function BiblicalCharactersGrid() {
  const router = useRouter();

  const handleChat = (characterName: string) => {
    const characterId = characterName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    router.push(`/chat/${characterId}`);
  };

  return (
    <div className={styles.gridContainer}>
      <h2 className={styles.title}>Escoge tu personal bíblico</h2>
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