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

    const response = await fetch(`${API_BASE_URL}/api/v1/feeling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
      },
      body: JSON.stringify({
        feeling,
        text,
      } as FeelingRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
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