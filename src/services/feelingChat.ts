import { handleRateLimit, incrementRateLimitCount } from '@/contexts/RateLimitContext';

interface FeelingResponse {
  verse: string;
  devotional: string;
  svg?: string;
}

interface FeelingRequest {
  feeling: string;
  text: string;
  include_svg?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getUserLanguage(): 'en' | 'es' {
  if (typeof window !== 'undefined') {
    const lang = localStorage.getItem('language');
    if (lang === 'en' || lang === 'es') {
      return lang;
    }
  }
  return 'es';
}

export const sendFeelingMessage = async (
  feeling: string,
  text: string,
  userName: string,
  includeSvg: boolean = false,
  language?: 'en' | 'es'
): Promise<FeelingResponse> => {
  const endpoint = 'feelingChat';

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    throw new Error('Rate limit exceeded');
  }

  try {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env.local file.');
    }

    if (!process.env.NEXT_PUBLIC_API_KEY) {
      throw new Error('API_KEY is not configured. Please check your environment variables.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    };

    const langToSend = language || getUserLanguage();

    const response = await fetch(`${API_BASE_URL}/api/v1/feeling?include_svg=${includeSvg}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        feeling,
        text,
        include_svg: includeSvg,
        language: langToSend,
      } as FeelingRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    const data: FeelingResponse = await response.json();
    return data;
  } catch (error) {
    //console.error('Error sending feeling message:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send feeling message: ${error.message}`);
    }
    throw error;
  }
};

export const getFeelingChat = async (feeling: string, message: string, userName: string, language?: 'en' | 'es') => {
  const endpoint = 'feelingChat';

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    throw new Error('Rate limit exceeded');
  }

  try {
    const langToSend = language || getUserLanguage();
    const response = await fetch('/api/feeling-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feeling, message, language: langToSend }),
    });

    if (!response.ok) {
      throw new Error('Failed to get feeling chat response');
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    return await response.json();
  } catch (error) {
    //console.error('Error getting feeling chat response:', error);
    throw error;
  }
}; 