interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface CharacterInfo {
  additionalProp1?: string;
  additionalProp2?: string;
  additionalProp3?: string;
}

interface ChatResponse {
  character_name: string;
  response: string;
  conversation_history: ChatMessage[];
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
  message: string
): Promise<ChatResponse> => {
  try {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env.local file.');
    }

    const response = await fetch(`${API_BASE_URL}/bible/characters/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
      },
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

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message to character:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
    throw error;
  }
}; 