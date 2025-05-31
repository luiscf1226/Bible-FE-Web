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
  console.log(`[Rate Limit] Checking rate limit for user ${userName} on endpoint ${endpoint}`);

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    console.log(`[Rate Limit] Rate limit exceeded for user ${userName} on endpoint ${endpoint}`);
    throw new Error('Rate limit exceeded');
  }

  try {
    console.log(`[Rate Limit] Making request for user ${userName} on endpoint ${endpoint}`);
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
    console.log(`[Rate Limit] Incremented count for user ${userName} on endpoint ${endpoint}`);

    return await response.json();
  } catch (error) {
    console.error('[Rate Limit] Error in verse explanation request:', error);
    throw error;
  }
};

export const getVerseExplanationMultiple = async (
  verses: string[],
  userName: string,
  verseTexts?: string[]
): Promise<VerseExplanationResponse> => {
  const endpoint = 'verseExplanationMultiple';
  console.log(`[Rate Limit] Checking rate limit for user ${userName} on endpoint ${endpoint}`);

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    console.log(`[Rate Limit] Rate limit exceeded for user ${userName} on endpoint ${endpoint}`);
    throw new Error('Rate limit exceeded');
  }

  try {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env.local file.');
    }

    if (!process.env.NEXT_PUBLIC_API_KEY) {
      throw new Error('API_KEY is not configured. Please check your environment variables.');
    }

    console.log(`[Rate Limit] Making request for user ${userName} on endpoint ${endpoint}`);
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
    console.log(`[Rate Limit] Incremented count for user ${userName} on endpoint ${endpoint}`);

    const data: VerseExplanationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[Rate Limit] Error in multiple verse explanation request:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get verse explanation: ${error.message}`);
    }
    throw error;
  }
}; 