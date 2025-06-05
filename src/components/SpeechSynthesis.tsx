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
        <p style="margin: 5px 0 0 0;">You've reached your daily limit of 3 premium audio requests. Using standard audio instead.</p>
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

  // Create refs to manage speech state
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log('Speech synthesis available');
      
      // Function to initialize voices
      const initializeVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        if (voices.length > 0) {
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      };

      // Try to get voices immediately
      initializeVoices();

      // If no voices are available, wait for them to load
      if (window.speechSynthesis.getVoices().length === 0) {
        console.log('No voices loaded, waiting for voices to be available');
        window.speechSynthesis.onvoiceschanged = initializeVoices;
      }
    } else {
      console.log('Speech synthesis not available');
    }
  }, []);

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      // Remove emojis and special characters
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getBestAvailableVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // First try to find a Spanish voice
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || 
      voice.name.includes('Spanish') || 
      voice.name.includes('Español')
    );
    
    if (spanishVoice) {
      return spanishVoice;
    }
    
    // If no Spanish voice, try to find an English voice
    const englishVoice = voices.find(voice => 
      voice.lang.includes('en') || 
      voice.name.includes('English')
    );
    
    if (englishVoice) {
      return englishVoice;
    }
    
    // If no specific language voice is found, return the first available voice
    return voices[0] || null;
  };

  const speakWithBrowser = (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        if (!window.speechSynthesis) {
          console.error('Browser speech synthesis not available');
          resolve(false);
          return;
        }

        // Clean the text before speaking
        const cleanText = cleanTextForSpeech(text);
        console.log('Cleaned text for speech:', cleanText);

        // Stop any ongoing speech first
        if (currentUtteranceRef.current || window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          currentUtteranceRef.current = null;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        currentUtteranceRef.current = utterance;
        
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
          console.error('No voices available');
          resolve(false);
          return;
        }

        // Try to find a Spanish voice
        const spanishVoice = getBestAvailableVoice();

        if (spanishVoice) {
          console.log('Using voice:', spanishVoice.name);
          utterance.voice = spanishVoice;
          utterance.lang = spanishVoice.lang;
        } else {
          console.log('No suitable voice found, using default');
          utterance.lang = 'es-ES';
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Set up event handlers
        utterance.onstart = () => {
          if (currentUtteranceRef.current === utterance) {
            console.log('Browser speech started successfully');
            isSpeakingRef.current = true;
            setState(prev => ({ ...prev, isSpeaking: true }));
            options?.onStart?.();
          }
        };

        utterance.onend = () => {
          if (currentUtteranceRef.current === utterance) {
            console.log('Browser speech ended successfully');
            currentUtteranceRef.current = null;
            isSpeakingRef.current = false;
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onEnd?.();
            resolve(true);
          }
        };

        utterance.onerror = (event) => {
          console.error('Browser speech error:', event.error, event);
          
          // Only handle the error if this is still the current utterance
          if (currentUtteranceRef.current === utterance) {
            currentUtteranceRef.current = null;
            
            // Don't treat 'interrupted' or 'canceled' as real errors
            if (event.error === 'canceled' || event.error === 'interrupted') {
              console.log('Speech was canceled/interrupted, not a real error');
              isSpeakingRef.current = false;
              setState(prev => ({ ...prev, isSpeaking: false }));
              resolve(false);
              return;
            }
            
            isSpeakingRef.current = false;
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onError?.();
            resolve(false);
          }
        };

        // Ensure speech synthesis is ready
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Start speaking with a small delay to ensure everything is ready
        setTimeout(() => {
          if (currentUtteranceRef.current === utterance) {
            try {
              console.log('Starting browser speech synthesis...');
              window.speechSynthesis.speak(utterance);
            } catch (error) {
              console.error('Error starting speech synthesis:', error);
              currentUtteranceRef.current = null;
              isSpeakingRef.current = false;
              setState(prev => ({ ...prev, isSpeaking: false }));
              options?.onError?.();
              resolve(false);
            }
          }
        }, 100);

      } catch (error) {
        console.error('Error in browser speech synthesis:', error);
        currentUtteranceRef.current = null;
        isSpeakingRef.current = false;
        setState(prev => ({ ...prev, isSpeaking: false }));
        options?.onError?.();
        resolve(false);
      }
    });
  };

  const speakText = async (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    if (!text) return;

    // Prevent multiple simultaneous speech attempts
    if (isSpeakingRef.current) {
      console.log('Already speaking, ignoring new request');
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.log('No ElevenLabs API key found, using browser synthesis');
        return await speakWithBrowser(text, options);
      }

      // Check rate limit for ElevenLabs audio
      if (userName && handleRateLimit('elevenlabs_audio', userName)) {
        console.log('Rate limit reached, using browser synthesis');
        return await speakWithBrowser(text, options);
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
        console.log('ElevenLabs API error:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          console.log('ElevenLabs API unauthorized, falling back to browser synthesis');
          return await speakWithBrowser(text, options);
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
      currentAudioRef.current = audioElement;

      return new Promise<void>((resolve, reject) => {
        audioElement.onplay = () => {
          isSpeakingRef.current = true;
          setState(prev => ({ ...prev, isSpeaking: true }));
          options?.onStart?.();
        };

        audioElement.onended = () => {
          if (currentAudioRef.current === audioElement) {
            currentAudioRef.current = null;
            isSpeakingRef.current = false;
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onEnd?.();
            URL.revokeObjectURL(audioUrl);
            resolve();
          }
        };

        audioElement.onerror = () => {
          if (currentAudioRef.current === audioElement) {
            currentAudioRef.current = null;
            isSpeakingRef.current = false;
            setState(prev => ({ ...prev, isSpeaking: false }));
            options?.onError?.();
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Audio playback failed'));
          }
        };

        audioElement.play().catch((error) => {
          console.error('Error playing ElevenLabs audio:', error);
          if (currentAudioRef.current === audioElement) {
            currentAudioRef.current = null;
            isSpeakingRef.current = false;
            setState(prev => ({ ...prev, isSpeking: false }));
            URL.revokeObjectURL(audioUrl);
            // Fall back to browser speech
            speakWithBrowser(text, options);
          }
        });
      });

    } catch (error: any) {
      console.log('ElevenLabs failed, falling back to browser synthesis:', error.message);
      
      if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
        setState(prev => ({ ...prev, isElevenLabsAvailable: false }));
        showElevenLabsLimitAlert();
      }
      
      // Always fall back to browser synthesis
      return await speakWithBrowser(text, options);
    }
  };

  const stop = () => {
    console.log('Stopping speech synthesis...');
    
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
    
    // Clear current utterance
    currentUtteranceRef.current = null;
    
    // Update state
    isSpeakingRef.current = false;
    setState(prev => ({ ...prev, isSpeaking: false }));
    
    console.log('Speech synthesis stopped');
  };

  return {
    speak: speakText,
    stop,
    isSpeaking: state.isSpeaking,
    isInitialized: state.isInitialized,
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