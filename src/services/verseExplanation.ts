import { handleRateLimit, incrementRateLimitCount } from '@/contexts/RateLimitContext';

interface VerseExplanationRequest {
  verses: string[];
  verse_texts?: string[];
}

interface VerseExplanationResponse {
  explanation: string;
  verses: string[];
  verse_texts?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getVerseExplanation = async (verse: string, userName: string) => {
  const endpoint = 'verseExplanation';

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    throw new Error('Rate limit exceeded');
  }

  try {
    const response = await fetch('/api/verse-explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verse }),
    });

    if (!response.ok) {
      throw new Error('Failed to get verse explanation');
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getVerseExplanationMultiple = async (
  verses: string[],
  userName: string,
  verseTexts?: string[]
): Promise<VerseExplanationResponse> => {
  const endpoint = 'verseExplanationMultiple';

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
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    };

    const response = await fetch(`${API_BASE_URL}/verses/explain`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        verses,
        verse_texts: verseTexts,
      } as VerseExplanationRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    const data: VerseExplanationResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get verse explanation: ${error.message}`);
    }
    throw error;
  }
}; 