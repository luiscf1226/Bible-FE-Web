interface RateLimitEntry {
  timestamp: number;
  count: number;
}

interface RateLimitData {
  [key: string]: RateLimitEntry;
}

const RATE_LIMIT_KEY = 'soulverse_rate_limits';
const MAX_REQUESTS = 5;
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const getStorageKey = (userName: string, endpoint: string) => `${RATE_LIMIT_KEY}_${userName}_${endpoint}`;

export const checkRateLimit = (userName: string, endpoint: string): { isLimited: boolean; remainingTime?: string } => {
  const storageKey = getStorageKey(userName, endpoint);
  const now = Date.now();
  
  // Get existing rate limit data
  const storedData = localStorage.getItem(storageKey);
  let rateLimitData: RateLimitEntry = storedData ? JSON.parse(storedData) : { timestamp: now, count: 0 };

  // Check if the time window has passed
  if (now - rateLimitData.timestamp > TIME_WINDOW) {
    // Reset if time window has passed
    rateLimitData = { timestamp: now, count: 0 };
    localStorage.setItem(storageKey, JSON.stringify(rateLimitData));
  }

  // Check if limit is reached
  if (rateLimitData.count >= MAX_REQUESTS) {
    const timeLeft = TIME_WINDOW - (now - rateLimitData.timestamp);
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    return {
      isLimited: true,
      remainingTime: `${hours}h ${minutes}m`
    };
  }

  return { isLimited: false };
};

export const incrementRateLimit = (userName: string, endpoint: string): void => {
  const storageKey = getStorageKey(userName, endpoint);
  const now = Date.now();
  
  // Get existing rate limit data
  const storedData = localStorage.getItem(storageKey);
  let rateLimitData: RateLimitEntry = storedData ? JSON.parse(storedData) : { timestamp: now, count: 0 };

  // Reset if time window has passed
  if (now - rateLimitData.timestamp > TIME_WINDOW) {
    rateLimitData = { timestamp: now, count: 1 };
  } else {
    rateLimitData.count += 1;
  }

  // Save updated data
  localStorage.setItem(storageKey, JSON.stringify(rateLimitData));
};

export const getRemainingRequests = (userName: string, endpoint: string): number => {
  const storageKey = getStorageKey(userName, endpoint);
  const now = Date.now();
  
  const storedData = localStorage.getItem(storageKey);
  if (!storedData) return MAX_REQUESTS;

  const rateLimitData: RateLimitEntry = JSON.parse(storedData);
  
  // Reset if time window has passed
  if (now - rateLimitData.timestamp > TIME_WINDOW) {
    return MAX_REQUESTS;
  }

  return Math.max(0, MAX_REQUESTS - rateLimitData.count);
}; 