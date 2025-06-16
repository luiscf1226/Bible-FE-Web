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
import SpeechRecognitionComponent from '@/components/SpeechRecognition';
import styles from './chat.module.css';
import { useTranslation } from '@/hooks/useTranslation';

// Add type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}


interface Message {
  role: 'user' | 'character';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const params = useParams();
  const { t } = useTranslation();
  // Character data with translations
  const characterData = {
    jesus: {
      name: t('chatCharacter.characters.jesus.name'),
      description: t('chatCharacter.characters.jesus.description'),
      imageUrl: '/images/characters/jesus.avif',
      theme: {
        accent: 'rgba(44, 82, 130, 0.8)',
        accentHover: 'rgba(44, 82, 130, 0.9)',
        border: 'rgba(44, 82, 130, 0.3)'
      }
    },
    moises: {
      name: t('chatCharacter.characters.moises.name'),
      description: t('chatCharacter.characters.moises.description'),
      imageUrl: '/images/characters/moises.avif',
      theme: {
        accent: 'rgba(44, 122, 123, 0.8)',
        accentHover: 'rgba(44, 122, 123, 0.9)',
        border: 'rgba(44, 122, 123, 0.3)'
      }
    },
    david: {
      name: t('chatCharacter.characters.david.name'),
      description: t('chatCharacter.characters.david.description'),
      imageUrl: '/images/characters/david.jpg',
      theme: {
        accent: 'rgba(85, 60, 154, 0.8)',
        accentHover: 'rgba(85, 60, 154, 0.9)',
        border: 'rgba(85, 60, 154, 0.3)'
      }
    },
    maria: {
      name: t('chatCharacter.characters.maria.name'),
      description: t('chatCharacter.characters.maria.description'),
      imageUrl: '/images/characters/maria.jpg',
      theme: {
        accent: 'rgba(155, 44, 44, 0.8)',
        accentHover: 'rgba(155, 44, 44, 0.9)',
        border: 'rgba(155, 44, 44, 0.3)'
      }
    },
    pablo: {
      name: t('chatCharacter.characters.pablo.name'),
      description: t('chatCharacter.characters.pablo.description'),
      imageUrl: '/images/characters/pablo.avif',
      theme: {
        accent: 'rgba(45, 55, 72, 0.8)',
        accentHover: 'rgba(45, 55, 72, 0.9)',
        border: 'rgba(45, 55, 72, 0.3)'
      }
    },
    abraham: {
      name: t('chatCharacter.characters.abraham.name'),
      description: t('chatCharacter.characters.abraham.description'),
      imageUrl: '/images/characters/abraham.jpg',
      theme: {
        accent: 'rgba(116, 66, 16, 0.8)',
        accentHover: 'rgba(116, 66, 16, 0.9)',
        border: 'rgba(116, 66, 16, 0.3)'
      }
    }
  };
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
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set background color based on character theme
  useEffect(() => {
    const root = document.documentElement;
    const accentColor = data.theme.accent;
    const [r, g, b] = accentColor.match(/\d+/g)?.map(Number) || [52, 53, 65];
    
    // Create a darker version of the accent color for the background
    const bgColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    // Create a lighter version for the grid lines
    const gridColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
    
    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--grid-color', gridColor);
  }, [data.theme.accent]);

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

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES'; // Set to Spanish

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
      };

      recognitionRef.current.onend = () => {
        stopRecording();
      };
    }

    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    
    setIsRecording(true);
    setTranscript('');
    recognitionRef.current.start();

    // Set 1-minute timeout
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 60000); // 1 minute
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsRecording(false);
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    // If there's a transcript, set it as the input message
    if (transcript) {
      setInputMessage(transcript);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    if (!userName) {
      setError(t('chatCharacter.errorNoName'));
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

  const handleTranscriptChange = (transcript: string) => {
    setInputMessage(transcript);
  };

  const handleRecordingComplete = (finalTranscript: string) => {
    setInputMessage(finalTranscript);
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
            {t('chatCharacter.back')}
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
              alt={t('chatCharacter.characterImageAlt', { name: data.name })}
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
            placeholder={t('chatCharacter.messagePlaceholder')}
            className={styles.messageInput}
          />
          <SpeechRecognitionComponent
            onTranscriptChange={handleTranscriptChange}
            onRecordingComplete={handleRecordingComplete}
            theme={data.theme}
            className={styles.speechRecognition}
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
            {t('chatCharacter.send')}
          </button>
        </form>
        
        {isRecording && (
          <div className={styles.recordingIndicator}>
            <div className={styles.recordingWave}></div>
            <span>{t('chatCharacter.recording', { transcript })}</span>
          </div>
        )}
      </div>
    </div>
  );
} 