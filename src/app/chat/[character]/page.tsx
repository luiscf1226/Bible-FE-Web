"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { sendCharacterMessage } from '@/services/characterChat';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';
import RateLimitAlert from '@/components/RateLimitAlert';
import { useSpeechSynthesis } from '@/components/SpeechSynthesis';
import MuteButton from '@/components/MuteButton';
import styles from './chat.module.css';

const characterData = {
  jesus: {
    name: 'Jesús',
    description: 'El Hijo de Dios, Salvador y Maestro que enseñó el amor y la compasión.',
    imageUrl: '/images/characters/jesus.avif',
    theme: {
      accent: 'rgba(44, 82, 130, 0.8)',
      accentHover: 'rgba(44, 82, 130, 0.9)',
      border: 'rgba(44, 82, 130, 0.3)'
    }
  },
  moises: {
    name: 'Moisés',
    description: 'Líder que liberó al pueblo de Israel y recibió los Diez Mandamientos.',
    imageUrl: '/images/characters/moises.avif',
    theme: {
      accent: 'rgba(44, 122, 123, 0.8)',
      accentHover: 'rgba(44, 122, 123, 0.9)',
      border: 'rgba(44, 122, 123, 0.3)'
    }
  },
  david: {
    name: 'David',
    description: 'Rey de Israel, poeta y guerrero que escribió los Salmos.',
    imageUrl: '/images/characters/david.jpg',
    theme: {
      accent: 'rgba(85, 60, 154, 0.8)',
      accentHover: 'rgba(85, 60, 154, 0.9)',
      border: 'rgba(85, 60, 154, 0.3)'
    }
  },
  maria: {
    name: 'María',
    description: 'Madre de Jesús, ejemplo de fe y humildad.',
    imageUrl: '/images/characters/maria.jpg',
    theme: {
      accent: 'rgba(155, 44, 44, 0.8)',
      accentHover: 'rgba(155, 44, 44, 0.9)',
      border: 'rgba(155, 44, 44, 0.3)'
    }
  },
  pablo: {
    name: 'Pablo',
    description: 'Apóstol que difundió el mensaje de Cristo por el mundo antiguo.',
    imageUrl: '/images/characters/pablo.avif',
    theme: {
      accent: 'rgba(45, 55, 72, 0.8)',
      accentHover: 'rgba(45, 55, 72, 0.9)',
      border: 'rgba(45, 55, 72, 0.3)'
    }
  },
  abraham: {
    name: 'Abraham',
    description: 'Padre de la fe, fundador del pueblo de Dios.',
    imageUrl: '/images/characters/abraham.jpg',
    theme: {
      accent: 'rgba(116, 66, 16, 0.8)',
      accentHover: 'rgba(116, 66, 16, 0.9)',
      border: 'rgba(116, 66, 16, 0.3)'
    }
  }
};

interface Message {
  role: 'user' | 'character';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const params = useParams();
  const character = params.character as keyof typeof characterData;
  const data = characterData[character];
  const { userName } = useUserName();
  const { showRateLimitAlert, rateLimitInfo, setShowRateLimitAlert, setRateLimitInfo } = useRateLimit();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    if (!userName) {
      setError('Por favor, ingresa tu nombre para continuar');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendCharacterMessage(userName, data.name, inputMessage, userName);

      // Only use the response and character_info from the API
      const characterMessage: Message = {
        role: 'character',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, characterMessage]);

      // Speak the character's response if not muted
      if (!isMuted) {
        stop(); // Stop any ongoing speech
        setTimeout(() => {
          speak(response.response);
        }, 100);
      }

      // Update character info if available
      if (response.character_info) {
        // You can store or use the character info as needed
        //console.log('Character Info:', response.character_info);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Rate limit exceeded')) {
          setRateLimitInfo({
            remainingTime: '24 horas',
            endpoint: 'characterChat'
          });
          setShowRateLimitAlert(true);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <RateLimitAlert
        showRateLimitAlert={showRateLimitAlert}
        rateLimitInfo={rateLimitInfo}
        onClose={() => {
          setShowRateLimitAlert(false);
          setRateLimitInfo(null);
        }}
      />
      
      <div className={styles.header} style={{ borderColor: data.theme.border }}>
        <div className={styles.headerControls}>
          <button 
            className={styles.backButton} 
            onClick={() => window.history.back()}
            style={{ 
              background: data.theme.accent,
              borderColor: data.theme.border
            }}
          >
            ← Volver
          </button>
          <MuteButton 
            isSpeaking={isSpeaking}
            onToggle={() => isSpeaking ? stop() : speak(messages[messages.length - 1]?.content || '')}
            className={styles.speakButton}
            style={{ 
              background: data.theme.accent,
              borderColor: data.theme.border
            }}
          />
        </div>
        <div className={styles.characterInfo} style={{ borderColor: data.theme.border }}>
          <div className={styles.imageContainer} style={{ borderColor: data.theme.border }}>
            <Image
              src={data.imageUrl}
              alt={data.name}
              width={80}
              height={80}
              className={styles.characterImage}
              priority
            />
          </div>
          <div className={styles.characterDetails}>
            <h1 className={styles.characterName}>{data.name}</h1>
            <p className={styles.characterDescription}>{data.description}</p>
          </div>
        </div>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.characterMessage
              }`}
              style={message.role === 'character' ? { borderColor: data.theme.border } : undefined}
            >
              <div className={styles.messageContent}>{message.content}</div>
              <div className={styles.messageTimestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.characterMessage}`} style={{ borderColor: data.theme.border }}>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className={styles.messageInput}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={isLoading || !inputMessage.trim()}
            style={{ 
              background: data.theme.accent,
              borderColor: data.theme.border
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
} 