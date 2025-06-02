import { useEffect, useState } from 'react';

interface SpeechSynthesisProps {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  autoPlay?: boolean;
}

interface SpeechSynthesisState {
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

const SPANISH_LANGUAGE_CODES = ['es-ES', 'es-MX', 'es-AR', 'es-CL', 'es-CO', 'es-PE', 'es-VE', 'es'];

// Voice quality scores for better voice selection
const VOICE_QUALITY_SCORES = {
  'Google': 100,
  'Microsoft': 90,
  'Premium': 85,
  'Enhanced': 80,
  'female': 75,
  'mujer': 75,
  'default': 50
};

const getVoiceQualityScore = (voice: SpeechSynthesisVoice): number => {
  const name = voice.name.toLowerCase();
  for (const [key, score] of Object.entries(VOICE_QUALITY_SCORES)) {
    if (name.includes(key.toLowerCase())) {
      return score;
    }
  }
  return VOICE_QUALITY_SCORES.default;
};

const getBestSpanishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // First, get all Spanish voices
  const spanishVoices = voices.filter(voice => 
    SPANISH_LANGUAGE_CODES.some(code => voice.lang.includes(code))
  );

  if (spanishVoices.length === 0) {
    return null;
  }

  // Sort voices by quality score
  const sortedVoices = spanishVoices.sort((a, b) => {
    const scoreA = getVoiceQualityScore(a);
    const scoreB = getVoiceQualityScore(b);
    return scoreB - scoreA;
  });

  return sortedVoices[0];
};

const processTextForNaturalSpeech = (text: string): string => {
  return text
    // Add pauses for punctuation
    .replace(/([.,;:!?])/g, '$1 ')
    // Add longer pauses for sentence endings
    .replace(/([.!?])\s+/g, '$1\n')
    // Add emphasis for exclamations and questions
    .replace(/([!?])/g, ' $1 ')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove spaces before punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
};

export const useSpeechSynthesis = () => {
  const [state, setState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    availableVoices: [],
    selectedVoice: null,
  });

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice => 
        SPANISH_LANGUAGE_CODES.some(code => voice.lang.includes(code))
      );
      
      const bestVoice = getBestSpanishVoice(voices);
      
      setState(prev => ({
        ...prev,
        availableVoices: spanishVoices,
        selectedVoice: bestVoice,
      }));
    };

    // Load voices immediately if available
    loadVoices();

    // Set up the event listener for when voices are loaded
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // For Brave browser, we need to ensure voices are loaded
    const isBrave = /Brave/.test(navigator.userAgent);
    if (isBrave) {
      // Force voice loading in Brave
      const checkVoices = setInterval(() => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          loadVoices();
          clearInterval(checkVoices);
        }
      }, 100);

      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkVoices), 5000);
    }

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speak = (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    if (!text) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Force Spanish language settings
    utterance.lang = 'es-ES';
    
    // Optimize voice settings for natural Spanish speech
    utterance.pitch = 1.0;  // Neutral pitch
    utterance.rate = 0.9;   // Slightly slower for clarity
    utterance.volume = 1.0; // Full volume
    
    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    }
    
    // Process text for more natural speech
    utterance.text = processTextForNaturalSpeech(text);
    
    // Add event handlers
    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
      options?.onStart?.();
    };
    
    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      options?.onEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setState(prev => ({ ...prev, isSpeaking: false }));
      options?.onError?.();
    };
    
    // Browser-specific optimizations
    const isBrave = /Brave/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !isBrave;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isBrave) {
      // Brave-specific optimizations
      utterance.rate = 0.95; // Slightly faster for Brave
      utterance.pitch = 1.0; // Neutral pitch for Brave
    } else if (isChrome) {
      // Chrome-specific optimizations
      utterance.rate = 0.95; // Slightly faster for Chrome
    } else if (isSafari) {
      // Safari-specific optimizations
      utterance.pitch = 1.05; // Slightly higher pitch for Safari
      utterance.rate = 0.85; // Slower rate for Safari
    }
    
    // Speak with a slight delay to ensure proper initialization
    setTimeout(() => {
      try {
        // For Brave, ensure we have a Spanish voice
        if (isBrave && !state.selectedVoice) {
          const voices = speechSynthesis.getVoices();
          const spanishVoice = voices.find(voice => 
            SPANISH_LANGUAGE_CODES.some(code => voice.lang.includes(code))
          );
          if (spanishVoice) {
            utterance.voice = spanishVoice;
          }
        }
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis failed:', error);
        options?.onError?.();
      }
    }, 50);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
  };

  return {
    speak,
    stop,
    isSpeaking: state.isSpeaking,
    availableVoices: state.availableVoices,
    selectedVoice: state.selectedVoice,
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