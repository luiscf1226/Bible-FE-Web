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

export const useSpeechSynthesis = () => {
  const [state, setState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    availableVoices: [],
    selectedVoice: null,
  });

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice => voice.lang.includes('es'));
      console.log('Available Spanish voices:', spanishVoices.map(v => `${v.name} (${v.lang})`));
      
      // Select the best Spanish voice
      const bestVoice = spanishVoices.find(voice => 
        voice.lang.includes('es') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || spanishVoices.find(voice => 
        voice.lang.includes('es') && 
        voice.name.includes('female')
      ) || spanishVoices[0];

      setState(prev => ({
        ...prev,
        availableVoices: spanishVoices,
        selectedVoice: bestVoice || null,
      }));
    };

    // Load voices immediately if available
    loadVoices();

    // Also set up the event listener for when voices are loaded
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
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
    utterance.lang = 'es-ES';
    
    // More natural Spanish voice settings
    utterance.pitch = 1.1;  // Slightly higher pitch for Spanish
    utterance.rate = 0.85;  // Slower rate for better clarity
    utterance.volume = 1.0; // Full volume
    
    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
      console.log('Using voice:', state.selectedVoice.name);
    }
    
    // Add natural pauses and improve prosody
    const processedText = text
      .replace(/\./g, '. ')
      .replace(/,/g, ', ')
      .replace(/:/g, ': ')
      .replace(/;/g, '; ')
      .replace(/!/g, '! ')
      .replace(/\?/g, '? ')
      .replace(/\s+/g, ' '); // Remove extra spaces
    
    utterance.text = processedText;
    
    // Add event handlers
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
    
    // Speak with a slight delay to ensure proper initialization
    setTimeout(() => {
      speechSynthesis.speak(utterance);
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