import { handleRateLimit, incrementRateLimitCount } from '@/contexts/RateLimitContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CharacterInfo {
  Época?: string;
  Ocupación?: string;
  Rasgos?: string;
  Legado?: string;
  [key: string]: string | undefined;
}

interface ChatResponse {
  character_name: string;
  response: string;
  conversation_history?: ChatMessage[];
  character_info: CharacterInfo;
}

interface ChatRequest {
  user_id: string;
  character_name: string;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const sendCharacterMessage = async (
  userId: string,
  characterName: string,
  message: string,
  userName: string
): Promise<ChatResponse> => {
  const endpoint = 'characterChat';

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

    const response = await fetch(`${API_BASE_URL}/bible/characters/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        character_name: characterName,
        message: message,
      } as ChatRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    const data: ChatResponse = await response.json();
    
    // Ensure the response has the correct structure
    if (!data.character_name || !data.response || !Array.isArray(data.conversation_history)) {
      throw new Error('Invalid response format from the server');
    }

    return data;
  } catch (error) {
    //console.error('Error sending message to character:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
    throw error;
  }
};

export const getCharacterChat = async (character: string, message: string, userName: string) => {
  const endpoint = 'characterChat';

  // Check rate limit
  if (handleRateLimit(endpoint, userName)) {
    throw new Error('Rate limit exceeded');
  }

  try {
    const response = await fetch('/api/character-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character, message }),
    });

    if (!response.ok) {
      throw new Error('Failed to get character chat response');
    }

    // Increment rate limit counter after successful request
    incrementRateLimitCount(endpoint, userName);

    return await response.json();
  } catch (error) {
    //console.error('Error getting character chat response:', error);
    throw error;
  }
}; 