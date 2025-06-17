import { handleRateLimit, incrementRateLimitCount } from '@/contexts/RateLimitContext';

interface PrayerRequest {
  petition: string;
  user_name: string;
  language: 'en' | 'es';
}

interface PrayerResponse {
  bible_verses: string[];
  prayer: string;
  explanation: string;
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

export const generatePrayer = async (petition: string, userName: string, language?: 'en' | 'es'): Promise<PrayerResponse> => {
  const endpoint = 'prayer';

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
      'Accept': 'application/json',
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    };

    const langToSend = language || getUserLanguage();

    const response = await fetch(`${API_BASE_URL}/prayers/petition`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        petition,
        user_name: userName,
        language: langToSend,
      } as PrayerRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    const data: PrayerResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate prayer: ${error.message}`);
    }
    throw error;
  }
}; 