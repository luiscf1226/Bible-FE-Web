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

export const getVerseExplanation = async (
  verses: string[],
  verseTexts?: string[]
): Promise<VerseExplanationResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env.local file.');
    }

    if (!process.env.NEXT_PUBLIC_API_KEY) {
      throw new Error('API_KEY is not configured. Please check your environment variables.');
    }

    // Debug logs
    console.log('Verse Explanation - API Key:', process.env.NEXT_PUBLIC_API_KEY);
    console.log('Verse Explanation - API Base URL:', API_BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    };

    console.log('Verse Explanation - Request Headers:', headers);

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
      console.error('Verse Explanation - Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: VerseExplanationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting verse explanation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get verse explanation: ${error.message}`);
    }
    throw error;
  }
}; 