"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { sendCharacterMessage } from '@/services/characterChat';
import styles from './chat.module.css';

const characterData = {
  jesus: {
    name: 'Jesús',
    description: 'El Hijo de Dios, Salvador y Maestro que enseñó el amor y la compasión.',
    imageUrl: '/images/characters/jesus.avif',
    theme: {
      gradient: 'linear-gradient(135deg, #2c5282 0%, #1a365d 100%)',
      buttonGradient: 'linear-gradient(90deg, #2c5282, #1a365d)'
    }
  },
  moises: {
    name: 'Moisés',
    description: 'Líder que liberó al pueblo de Israel y recibió los Diez Mandamientos.',
    imageUrl: '/images/characters/moises.avif',
    theme: {
      gradient: 'linear-gradient(135deg, #2c7a7b 0%, #234e52 100%)',
      buttonGradient: 'linear-gradient(90deg, #2c7a7b, #234e52)'
    }
  },
  david: {
    name: 'David',
    description: 'Rey de Israel, poeta y guerrero que escribió los Salmos.',
    imageUrl: '/images/characters/david.jpg',
    theme: {
      gradient: 'linear-gradient(135deg, #553c9a 0%, #44337a 100%)',
      buttonGradient: 'linear-gradient(90deg, #553c9a, #44337a)'
    }
  },
  maria: {
    name: 'María',
    description: 'Madre de Jesús, ejemplo de fe y humildad.',
    imageUrl: '/images/characters/maria.jpg',
    theme: {
      gradient: 'linear-gradient(135deg, #9b2c2c 0%, #742a2a 100%)',
      buttonGradient: 'linear-gradient(90deg, #9b2c2c, #742a2a)'
    }
  },
  pablo: {
    name: 'Pablo',
    description: 'Apóstol que difundió el mensaje de Cristo por el mundo antiguo.',
    imageUrl: '/images/characters/pablo.avif',
    theme: {
      gradient: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
      buttonGradient: 'linear-gradient(90deg, #2d3748, #1a202c)'
    }
  },
  abraham: {
    name: 'Abraham',
    description: 'Padre de la fe, fundador del pueblo de Dios.',
    imageUrl: '/images/characters/abraham.jpg',
    theme: {
      gradient: 'linear-gradient(135deg, #744210 0%, #5c3410 100%)',
      buttonGradient: 'linear-gradient(90deg, #744210, #5c3410)'
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRateLimitAlert, setShowRateLimitAlert] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remainingTime: string;
    resetTime: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const userId = 'user123'; // Replace with actual user ID
      const response = await sendCharacterMessage(userId, data.name, inputMessage);

      const characterMessage: Message = {
        role: 'character',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, characterMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('429')) {
          try {
            // Extract the JSON part from the error message
            const jsonStr = errorMessage.split('message: ')[1];
            if (jsonStr) {
              const errorData = JSON.parse(jsonStr);
              if (errorData.detail) {
                setRateLimitInfo({
                  remainingTime: errorData.detail.remaining_time,
                  resetTime: errorData.detail.reset_time
                });
                setShowRateLimitAlert(true);
              }
            }
          } catch (e) {
            console.error('Error parsing rate limit info:', e);
            // Fallback message if parsing fails
            setRateLimitInfo({
              remainingTime: '24 horas',
              resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            setShowRateLimitAlert(true);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer} style={{ background: data.theme.gradient }}>
      {showRateLimitAlert && (
        <div className={styles.rateLimitAlert}>
          <div className={styles.rateLimitContent}>
            <h3>Límite de uso alcanzado</h3>
            <p>
              Has alcanzado el límite de 5 mensajes por 24 horas. 
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
              onClick={() => {
                setShowRateLimitAlert(false);
                setRateLimitInfo(null);
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => window.history.back()}>
          ← Volver
        </button>
        <div className={styles.characterInfo}>
          <div className={styles.imageContainer}>
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
            >
              <div className={styles.messageContent}>{message.content}</div>
              <div className={styles.messageTimestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.characterMessage}`}>
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

        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className={styles.messageInput}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            style={{ background: data.theme.buttonGradient }}
            disabled={isLoading || !inputMessage.trim()}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
} 