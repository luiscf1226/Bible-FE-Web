import { useState, useRef, useEffect } from 'react';
import styles from './styles.module.css';

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
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionProps {
  onTranscriptChange: (transcript: string) => void;
  onRecordingComplete: (finalTranscript: string) => void;
  language?: string;
  maxDuration?: number; // in milliseconds
  className?: string;
  theme?: {
    accent: string;
    border: string;
  };
}

export default function SpeechRecognitionComponent({
  onTranscriptChange,
  onRecordingComplete,
  language = 'es-ES',
  maxDuration = 60000, // 1 minute default
  className = '',
  theme = {
    accent: 'rgba(44, 82, 130, 0.8)',
    border: 'rgba(44, 82, 130, 0.3)'
  }
}: SpeechRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(maxDuration / 1000);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    const initSpeechRecognition = () => {
      try {
        if (typeof window !== 'undefined') {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            console.log('Speech Recognition is supported');
            setIsSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language;

            recognitionRef.current.onstart = () => {
              console.log('Speech recognition started');
            };

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
              console.log('Speech recognition result received');
              let interimTranscript = '';
              let finalTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  finalTranscript += transcript;
                } else {
                  interimTranscript += transcript;
                }
              }

              if (finalTranscript) {
                console.log('Final transcript:', finalTranscript);
                finalTranscriptRef.current = finalTranscript;
              }

              const currentTranscript = finalTranscript || interimTranscript;
              setTranscript(currentTranscript);
              onTranscriptChange(currentTranscript);
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
              console.error('Speech recognition error:', event.error);
              if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
                stopRecording();
              }
            };

            recognitionRef.current.onend = () => {
              console.log('Speech recognition ended');
              if (isRecording && !recordingTimeoutRef.current) {
                try {
                  console.log('Attempting to restart recognition');
                  recognitionRef.current?.start();
                } catch (error) {
                  console.error('Error restarting recognition:', error);
                  stopRecording();
                }
              }
            };
          } else {
            console.log('Speech Recognition is not supported in this browser');
            setIsSupported(false);
          }
        }
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setIsSupported(false);
      }
    };

    initSpeechRecognition();

    return () => {
      stopRecording();
    };
  }, [language, onTranscriptChange, isRecording]);

  const startRecording = () => {
    console.log('Attempting to start recording');
    if (!recognitionRef.current || !isSupported) {
      console.log('Speech recognition not available');
      return;
    }
    
    try {
      // Set state before starting recognition
      setIsRecording(true);
      setTranscript('');
      finalTranscriptRef.current = '';
      setTimeLeft(maxDuration / 1000);

      // Start recognition
      recognitionRef.current.start();
      console.log('Recording started successfully');

      // Start timers
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, maxDuration);
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsRecording(false); // Reset state if there's an error
      stopRecording();
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording');
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    } finally {
      // Clear all timers first
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Then update state
      setIsRecording(false);
      
      // Process final transcript
      const finalTranscript = finalTranscriptRef.current || transcript;
      if (finalTranscript) {
        console.log('Final transcript on stop:', finalTranscript);
        onRecordingComplete(finalTranscript);
      }
    }
  };

  const toggleRecording = () => {
    console.log('Toggle recording clicked, current state:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <button 
        type="button"
        className={styles.micButton}
        style={{ 
          background: theme.accent,
          borderColor: theme.border,
          opacity: 0.5
        }}
        title="Speech recognition not supported in this browser"
        disabled
      >
        <svg 
          className={styles.micIcon} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M19 11V12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12V11M12 19V22M12 22H15M12 22H9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <button 
        type="button"
        onClick={toggleRecording}
        className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
        style={{ 
          background: isRecording ? '#dc2626' : theme.accent,
          borderColor: isRecording ? '#dc2626' : theme.border,
          color: isRecording ? '#ffffff' : 'currentColor'
        }}
        title={isRecording ? "Detener grabación" : "Iniciar grabación"}
      >
        {isRecording ? (
          <div className={styles.recordingIcon}>
            <div className={styles.recordingWave}></div>
            <span className={styles.timeLeft}>{timeLeft}s</span>
          </div>
        ) : (
          <svg 
            className={styles.micIcon} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M19 11V12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12V11M12 19V22M12 22H15M12 22H9" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      
      {isRecording && (
        <div className={styles.recordingIndicator}>
          <div className={styles.recordingWave}></div>
          <span>Grabando... {transcript}</span>
        </div>
      )}
    </div>
  );
} 