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
import SpeechRecognitionComponent from '@/components/SpeechRecognition';
import styles from './chat.module.css';
import { FaImage } from 'react-icons/fa';
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

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.toast}>
      <p>{message}</p>
      <button onClick={onClose}>×</button>
    </div>
  );
};

const feelings = [
  { text: 'Alegría', emoji: '😊', theme: { accent: 'rgba(234, 179, 8, 0.8)', border: 'rgba(234, 179, 8, 0.3)' } },
  { text: 'Tristeza', emoji: '😢', theme: { accent: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 0.3)' } },
  { text: 'Enojo', emoji: '😠', theme: { accent: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 0.3)' } },
  { text: 'Miedo', emoji: '😨', theme: { accent: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 0.3)' } },
  { text: 'Ansiedad', emoji: '😰', theme: { accent: 'rgba(249, 115, 22, 0.8)', border: 'rgba(249, 115, 22, 0.3)' } },
  { text: 'Esperanza', emoji: '✨', theme: { accent: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 0.3)' } },
  { text: 'Gratitud', emoji: '🙏', theme: { accent: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 0.3)' } },
  { text: 'Paz', emoji: '🕊️', theme: { accent: 'rgba(14, 165, 233, 0.8)', border: 'rgba(14, 165, 233, 0.3)' } },
  { text: 'Confusión', emoji: '🤔', theme: { accent: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 0.3)' } },
  { text: 'Duda', emoji: '❓', theme: { accent: 'rgba(156, 163, 175, 0.8)', border: 'rgba(156, 163, 175, 0.3)' } }
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
  const [showToast, setShowToast] = useState(false);
  const { userName } = useUserName();
  const { showRateLimitAlert, rateLimitInfo, setShowRateLimitAlert, setRateLimitInfo } = useRateLimit();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

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

  const handleFeelingSelect = (feeling: string) => {
    setSelectedFeeling(feeling);
    setShowToast(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedFeeling) {
      setError(t('chat.errorNoFeeling'));
      return;
    }

    if (!userName) {
      setError(t('chat.errorNoName'));
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
      if (error.message.includes('Rate limit exceeded')) {
        setRateLimitInfo({
          remainingTime: '24 horas',
          endpoint: 'feelingChat'
        });
        setShowRateLimitAlert(true);
      } else {
        setError(t('chat.errorSend'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFeelingData = selectedFeeling ? feelings.find(f => f.text === selectedFeeling) : null;

  const handleTranscriptChange = (transcript: string) => {
    setTranscript(transcript);
  };

  const handleRecordingComplete = (finalTranscript: string) => {
    setTranscript(finalTranscript);
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
      {showToast && selectedFeeling && (
        <Toast
          message={t('chat.toastWriteAboutFeeling', { feeling: t(`chat.feelings.${selectedFeeling}`) })}
          onClose={() => setShowToast(false)}
        />
      )}
      <div className={styles.chatContainer}>
        <div className={styles.header}>
          <div className={styles.headerControls}>
            <h1>{t('chat.howDoYouFeelToday')}</h1>
            <div className={styles.controls}>
              <button
                className={`${styles.imageToggle} ${includeSvg ? styles.active : ''}`}
                onClick={() => setIncludeSvg(!includeSvg)}
                title={includeSvg ? t('chat.deactivateAIImages') : t('chat.activateAIImages')}
                style={selectedFeelingData ? {
                  background: selectedFeelingData.theme.accent,
                  borderColor: selectedFeelingData.theme.border
                } : undefined}
              >
                <FaImage />
                <span>{includeSvg ? t('chat.aiImagesActivated') : t('chat.activateAIImagesShort')}</span>
              </button>
              <MuteButton 
                isSpeaking={isSpeaking}
                onToggle={() => isSpeaking ? stop() : speak(messages[messages.length - 1]?.text || '')}
                className={styles.speakButton}
                style={selectedFeelingData ? {
                  background: selectedFeelingData.theme.accent,
                  borderColor: selectedFeelingData.theme.border
                } : undefined}
              />
            </div>
          </div>
          <div className={styles.feelingSelector}>
            {feelings.map((feeling) => (
              <button
                key={feeling.text}
                className={`${styles.feelingButton} ${selectedFeeling === feeling.text ? styles.selected : ''}`}
                onClick={() => handleFeelingSelect(feeling.text)}
                style={selectedFeeling === feeling.text ? {
                  background: feeling.theme.accent,
                  borderColor: feeling.theme.border
                } : undefined}
              >
                <span className={styles.emoji}>{feeling.emoji}</span>
                <span className={styles.feelingText}>{t(`chat.feelings.${feeling.text}`)}</span>
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
          theme={selectedFeelingData?.theme}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading || !selectedFeeling}
          theme={selectedFeelingData?.theme}
          placeholder={selectedFeeling ? t('chat.tellMeAboutFeeling', { feeling: t(`chat.feelings.${selectedFeeling}`) }) : t('chat.selectFeelingToStart')}
          transcript={transcript}
          speechRecognition={
            <SpeechRecognitionComponent
              onTranscriptChange={handleTranscriptChange}
              onRecordingComplete={handleRecordingComplete}
              theme={selectedFeelingData?.theme}
              className={styles.speechRecognition}
            />
          }
        />
      </div>
    </div>
  );
} 