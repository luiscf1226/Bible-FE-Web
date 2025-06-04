import { useEffect, useState, useRef } from 'react';
import { handleRateLimit, incrementRateLimitCount } from '@/contexts/RateLimitContext';
import { useUserName } from '@/contexts/UserNameContext';

interface SpeechSynthesisProps {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  autoPlay?: boolean;
}

interface SpeechSynthesisState {
  isSpeaking: boolean;
  isElevenLabsAvailable: boolean;
  isInitialized: boolean;
  currentVoiceIndex: number;
}

interface SpeechQueueItem {
  text: string;
  voice: SpeechSynthesisVoice;
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  };
}

const processTextForNaturalSpeech = (text: string): string => {
  return text
    .replace(/([.,;:!?])/g, '$1 ')
    .replace(/([.!?])\s+/g, '$1\n')
    .replace(/([!?])/g, ' $1 ')
    .replace(/,/g, ', ')
    .replace(/;/g, '; ')
    .replace(/:/g, ': ')
    .replace(/\b(Dios|Señor|Jesús|Cristo)\b/gi, '<emphasis>$1</emphasis>')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
};

const showElevenLabsLimitAlert = () => {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f8d7da;
    color: #721c24;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideIn 0.5s ease-out;
  `;
  
  alertDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">🔊</span>
      <div>
        <strong>Audio Limit Reached</strong>
        <p style="margin: 5px 0 0 0;">You've reached your daily limit of 10 audio requests. Please try again tomorrow.</p>
      </div>
    </div>
  `;

  document.body.appendChild(alertDiv);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.5s ease-in';
    style.textContent += `
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    setTimeout(() => {
      document.body.removeChild(alertDiv);
      document.head.removeChild(style);
    }, 500);
  }, 5000);
};

export const useSpeechSynthesis = () => {
  const [state, setState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    isElevenLabsAvailable: true,
    isInitialized: false,
    currentVoiceIndex: 0
  });
  const { userName } = useUserName();

  // Create a ref to store the speech queue
  const speechQueue = useRef<SpeechQueueItem[]>([]);
  const isProcessingQueue = useRef(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Ensure we have voices loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          setState(prev => ({ ...prev, isInitialized: true }));
        };
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    }
  }, []);

  const getAllVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.sort((a, b) => {
      // Prioritize Spanish voices
      const aIsSpanish = a.lang.includes('es');
      const bIsSpanish = b.lang.includes('es');
      if (aIsSpanish && !bIsSpanish) return -1;
      if (!aIsSpanish && bIsSpanish) return 1;
      return 0;
    });
  };

  const getNextVoice = () => {
    const voices = getAllVoices();
    if (voices.length === 0) return null;

    // Try to find a Spanish voice first
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || 
      voice.name.includes('Spanish') || 
      voice.name.includes('Español')
    );

    if (spanishVoice) {
      return spanishVoice;
    }

    // If no Spanish voice, try to find any voice
    const nextIndex = (state.currentVoiceIndex + 1) % voices.length;
    setState(prev => ({ ...prev, currentVoiceIndex: nextIndex }));
    return voices[nextIndex];
  };

  const processQueue = () => {
    if (isProcessingQueue.current || speechQueue.current.length === 0 || !state.isInitialized) return;

    isProcessingQueue.current = true;
    const item = speechQueue.current[0];

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(item.text);
    currentUtterance.current = utterance;
    
    // Try different voices if current one fails
    const voice = getNextVoice();
    if (!voice) {
      console.error('No voices available');
      isProcessingQueue.current = false;
      return;
    }

    utterance.lang = 'es-ES';
    utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log('Speech started with voice:', voice.name);
      retryCount.current = 0;
      setState(prev => ({ ...prev, isSpeaking: true }));
      item.options?.onStart?.();
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setState(prev => ({ ...prev, isSpeaking: false }));
      item.options?.onEnd?.();
      
      // Remove the completed item from the queue
      speechQueue.current.shift();
      isProcessingQueue.current = false;
      currentUtterance.current = null;
      
      // Process next item if any
      if (speechQueue.current.length > 0) {
        setTimeout(processQueue, 100);
      }
    };

    utterance.onerror = (event) => {
      console.log('Speech error:', event);
      
      // Try next voice if current one fails
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying with different voice (attempt ${retryCount.current})`);
        isProcessingQueue.current = false;
        processQueue();
        return;
      }

      if (event.error === 'interrupted' || event.error === 'canceled') {
        setState(prev => ({ ...prev, isSpeaking: false }));
        return;
      }
      
      console.error('Browser speech synthesis error:', event);
      setState(prev => ({ ...prev, isSpeaking: false }));
      item.options?.onError?.();
      showElevenLabsLimitAlert();
    };

    try {
      // Ensure speech synthesis is in a good state
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Speak the utterance
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking text:', error);
      isProcessingQueue.current = false;
      currentUtterance.current = null;
      
      // Try next voice if current one fails
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying with different voice (attempt ${retryCount.current})`);
        setTimeout(processQueue, 100);
      }
    }
  };

  const speakWithBrowser = (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    try {
      if (!window.speechSynthesis || !state.isInitialized) {
        throw new Error('Browser speech synthesis not available or not initialized');
      }

      const voices = getAllVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = getAllVoices();
          if (voices.length > 0) {
            const voice = voices[0];
            addToQueue(text, voice, options);
          }
        };
        return;
      }

      const voice = voices[0];
      addToQueue(text, voice, options);
      return true;
    } catch (error) {
      console.error('Browser speech synthesis error:', error);
      setState(prev => ({ ...prev, isSpeaking: false }));
      options?.onError?.();
      showElevenLabsLimitAlert();
      return false;
    }
  };

  const addToQueue = (text: string, voice: SpeechSynthesisVoice, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    if (!text || !voice) return;
    
    speechQueue.current.push({ text, voice, options });
    if (!isProcessingQueue.current) {
      processQueue();
    }
  };

  const speakText = async (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    if (!text) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found');
      }

      // Check rate limit for ElevenLabs audio
      if (userName && handleRateLimit('elevenlabs_audio', userName)) {
        showElevenLabsLimitAlert();
        throw new Error('Rate limit exceeded');
      }

      const processedText = processTextForNaturalSpeech(text);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify({
            text: processedText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: false
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401 && errorText.includes('quota_exceeded')) {
          const utterance = new SpeechSynthesisUtterance(processedText);
          utterance.lang = 'es-ES';
          
          utterance.onstart = () => {
            setState(prev => ({ ...prev, isSpeaking: true }));
            options?.onStart?.();
          };
          
          utterance.onend = () => {
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onEnd?.();
          };
          
          utterance.onerror = () => {
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onError?.();
          };
          
          window.speechSynthesis.speak(utterance);
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Increment rate limit counter after successful request
      if (userName) {
        incrementRateLimitCount('elevenlabs_audio', userName);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);

      audioElement.onplay = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
        options?.onStart?.();
      };

      audioElement.onended = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        options?.onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };

      audioElement.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        options?.onError?.();
        URL.revokeObjectURL(audioUrl);
      };

      await audioElement.play();
    } catch (error: any) {
      if (!error.message?.includes('quota_exceeded')) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-ES';
          
          utterance.onstart = () => {
            setState(prev => ({ ...prev, isSpeaking: true }));
            options?.onStart?.();
          };
          
          utterance.onend = () => {
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onEnd?.();
          };
          
          utterance.onerror = () => {
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onError?.();
          };
          
          window.speechSynthesis.speak(utterance);
          return;
        } catch (fallbackError) {
          // Silent fallback error
        }
      }
      
      if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
        setState(prev => ({ ...prev, isElevenLabsAvailable: false }));
        showElevenLabsLimitAlert();
      }
      
      options?.onError?.();
    }
  };

  const stop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentUtterance.current) {
      currentUtterance.current = null;
    }
    speechQueue.current = [];
    isProcessingQueue.current = false;
    retryCount.current = 0;
    setState(prev => ({ ...prev, isSpeaking: false }));
  };

  return {
    speak: speakText,
    stop,
    isSpeaking: state.isSpeaking,
  };
};

export const SpeechSynthesis: React.FC<SpeechSynthesisProps> = ({
  text,
  onStart,
  onEnd,
  onError,
  autoPlay = false,
}) => {
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    if (autoPlay && text) {
      speak(text, { onStart, onEnd, onError });
    }
  }, [text, autoPlay]);

  return null;
};

export default SpeechSynthesis; 