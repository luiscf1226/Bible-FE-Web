interface FeelingResponse {
  verse: string;
  devotional: string;
}

interface FeelingRequest {
  feeling: string;
  text: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const sendFeelingMessage = async (
  feeling: string,
  text: string
): Promise<FeelingResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env.local file.');
    }

    if (!process.env.NEXT_PUBLIC_API_KEY) {
      throw new Error('API_KEY is not configured. Please check your environment variables.');
    }

    // Debug logs
    console.log('API Key:', process.env.NEXT_PUBLIC_API_KEY);
    console.log('API Base URL:', API_BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
    };

    console.log('Request Headers:', headers);

    const response = await fetch(`${API_BASE_URL}/api/v1/feeling`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        feeling,
        text,
      } as FeelingRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: FeelingResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending feeling message:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send feeling message: ${error.message}`);
    }
    throw error;
  }
}; 