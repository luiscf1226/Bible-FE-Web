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
  isElevenLabsAvailable: boolean;
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
        <strong>¡Ups! 😊</strong>
        <p style="margin: 5px 0 0 0;">Por el momento no tenemos audio disponible. ¡Volveremos pronto!</p>
      </div>
    </div>
  `;

  document.body.appendChild(alertDiv);

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Remove alert after 5 seconds
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
  });

  const speakText = async (text: string, options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }) => {
    if (!text) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      //console.log('API Key available:', !!apiKey);
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found');
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
        console.error('ElevenLabs API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // If it's a quota error, fall back to browser's speech synthesis
        if (response.status === 401 && errorText.includes('quota_exceeded')) {
          console.log('Falling back to browser speech synthesis');
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
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
      console.error('ElevenLabs error:', error);
      
      // If it's not a quota error, try browser's speech synthesis
      if (!error.message?.includes('quota_exceeded')) {
        try {
          console.log('Falling back to browser speech synthesis');
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
          console.error('Browser speech synthesis error:', fallbackError);
        }
      }
      
      // Check if it's a quota exceeded error
      if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
        setState(prev => ({ ...prev, isElevenLabsAvailable: false }));
        showElevenLabsLimitAlert();
      }
      
      options?.onError?.();
    }
  };

  const stop = () => {
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