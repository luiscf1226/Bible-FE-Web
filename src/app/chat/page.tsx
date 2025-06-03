'use client';

import { useState, useRef, useEffect } from 'react';
import { sendFeelingMessage } from '@/services/feelingChat';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import RateLimitAlert from '@/components/RateLimitAlert';
import { useSpeechSynthesis } from '@/components/SpeechSynthesis';
import MuteButton from '@/components/MuteButton';
import styles from './chat.module.css';
import { FaImage } from 'react-icons/fa';

const feelings = [
  { text: 'Alegría', emoji: '😊' },
  { text: 'Tristeza', emoji: '😢' },
  { text: 'Enojo', emoji: '😠' },
  { text: 'Miedo', emoji: '😨' },
  { text: 'Ansiedad', emoji: '😰' },
  { text: 'Esperanza', emoji: '✨' },
  { text: 'Gratitud', emoji: '🙏' },
  { text: 'Paz', emoji: '🕊️' },
  { text: 'Confusión', emoji: '🤔' },
  { text: 'Duda', emoji: '❓' }
];

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  verse?: string;
  devotional?: string;
  svg?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSvg, setIncludeSvg] = useState(false);
  const { userName } = useUserName();
  const { showRateLimitAlert, rateLimitInfo, setShowRateLimitAlert, setRateLimitInfo } = useRateLimit();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const handleSendMessage = async (message: string) => {
    if (!selectedFeeling) {
      setError('Por favor, selecciona un sentimiento antes de enviar un mensaje');
      return;
    }

    if (!userName) {
      setError('Por favor, ingresa tu nombre para continuar');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get response from API
      const response = await sendFeelingMessage(message, selectedFeeling, userName, includeSvg);
      
      if (response.devotional) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: response.devotional,
          sender: 'bot',
          timestamp: new Date(),
          verse: response.verse,
          devotional: response.devotional,
          svg: response.svg
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Speak the response with proper pauses if not muted
        if (!isSpeaking) {
          const textToSpeak = response.verse 
            ? `${response.verse}. ${response.devotional}`
            : response.devotional;
          
          // Stop any ongoing speech before starting new one
          stop();
          
          // Add a small delay before speaking to ensure the message is displayed
          setTimeout(() => {
            speak(textToSpeak);
          }, 100);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.message.includes('Rate limit exceeded')) {
        setRateLimitInfo({
          remainingTime: '24 horas',
          endpoint: 'feelingChat'
        });
        setShowRateLimitAlert(true);
      } else {
        setError('Error al enviar el mensaje. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <RateLimitAlert
        showRateLimitAlert={showRateLimitAlert}
        rateLimitInfo={rateLimitInfo}
        onClose={() => {
          setShowRateLimitAlert(false);
          setRateLimitInfo(null);
        }}
      />
      <div className={styles.chatContainer}>
        <div className={styles.header}>
          <div className={styles.headerControls}>
            <h1>¿Cómo te sientes hoy?</h1>
            <div className={styles.controls}>
              <button
                className={`${styles.imageToggle} ${includeSvg ? styles.active : ''}`}
                onClick={() => setIncludeSvg(!includeSvg)}
                title={includeSvg ? "Desactivar imágenes" : "Activar imágenes"}
              >
                <FaImage />
                <span>{includeSvg ? "Imágenes activadas" : "Activar imágenes"}</span>
              </button>
              <MuteButton 
                isSpeaking={isSpeaking}
                onToggle={() => isSpeaking ? stop() : speak(messages[messages.length - 1]?.text || '')}
                className={styles.speakButton}
              />
            </div>
          </div>
          <div className={styles.feelingSelector}>
            {feelings.map((feeling) => (
              <button
                key={feeling.text}
                className={`${styles.feelingButton} ${selectedFeeling === feeling.text ? styles.selected : ''}`}
                onClick={() => setSelectedFeeling(feeling.text)}
              >
                <span className={styles.emoji}>{feeling.emoji}</span>
                <span className={styles.feelingText}>{feeling.text}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <ChatMessages 
          messages={messages} 
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          onSpeak={speak}
          isSpeaking={isSpeaking}
          onStopSpeaking={stop}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading || !selectedFeeling}
        />
      </div>
    </div>
  );
} 