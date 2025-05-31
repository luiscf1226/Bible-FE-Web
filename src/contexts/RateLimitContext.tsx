"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { checkRateLimit, incrementRateLimit, getRemainingRequests } from '@/services/rateLimit';
import { useUserName } from './UserNameContext';

interface RateLimitContextType {
  checkEndpointLimit: (endpoint: string) => { isLimited: boolean; remainingTime?: string };
  incrementEndpointLimit: (endpoint: string) => void;
  getEndpointRemainingRequests: (endpoint: string) => number;
  showRateLimitAlert: boolean;
  rateLimitInfo: { remainingTime: string; endpoint: string } | null;
  setShowRateLimitAlert: (show: boolean) => void;
  setRateLimitInfo: (info: { remainingTime: string; endpoint: string } | null) => void;
}

// Create a global object to store rate limit functions
let rateLimitFunctions: {
  setShowRateLimitAlert: (show: boolean) => void;
  setRateLimitInfo: (info: { remainingTime: string; endpoint: string } | null) => void;
} | null = null;

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [showRateLimitAlert, setShowRateLimitAlert] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remainingTime: string; endpoint: string } | null>(null);
  const { userName } = useUserName();

  // Store the functions in the global object
  rateLimitFunctions = {
    setShowRateLimitAlert,
    setRateLimitInfo,
  };

  // Log rate limit state changes
  useEffect(() => {
    if (rateLimitInfo) {
      console.log(`[Rate Limit] Alert shown for endpoint ${rateLimitInfo.endpoint} with remaining time: ${rateLimitInfo.remainingTime}`);
    }
  }, [rateLimitInfo]);

  const checkEndpointLimit = (endpoint: string) => {
    if (!userName) {
      console.log('[Rate Limit] No user name available for rate limit check');
      return { isLimited: false };
    }
    console.log(`[Rate Limit] Checking limit for endpoint ${endpoint}`);
    return checkRateLimit(userName, endpoint);
  };

  const incrementEndpointLimit = (endpoint: string) => {
    if (!userName) {
      console.log('[Rate Limit] No user name available for rate limit increment');
      return;
    }
    console.log(`[Rate Limit] Incrementing limit for endpoint ${endpoint}`);
    incrementRateLimit(userName, endpoint);
  };

  const getEndpointRemainingRequests = (endpoint: string) => {
    if (!userName) {
      console.log('[Rate Limit] No user name available for remaining requests check');
      return 5;
    }
    console.log(`[Rate Limit] Getting remaining requests for endpoint ${endpoint}`);
    return getRemainingRequests(userName, endpoint);
  };

  return (
    <RateLimitContext.Provider
      value={{
        checkEndpointLimit,
        incrementEndpointLimit,
        getEndpointRemainingRequests,
        showRateLimitAlert,
        rateLimitInfo,
        setShowRateLimitAlert,
        setRateLimitInfo,
      }}
    >
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}

// Export non-hook version of rate limit functions
export const handleRateLimit = (endpoint: string, userName: string) => {
  console.log(`[Rate Limit] Handling rate limit for user ${userName} on endpoint ${endpoint}`);
  const { isLimited, remainingTime } = checkRateLimit(userName, endpoint);
  
  if (isLimited && rateLimitFunctions) {
    console.log(`[Rate Limit] Setting rate limit alert for endpoint ${endpoint}`);
    rateLimitFunctions.setRateLimitInfo({ remainingTime: remainingTime!, endpoint });
    rateLimitFunctions.setShowRateLimitAlert(true);
    return true;
  }
  
  return false;
};

export const incrementRateLimitCount = (endpoint: string, userName: string) => {
  console.log(`[Rate Limit] Incrementing rate limit count for user ${userName} on endpoint ${endpoint}`);
  incrementRateLimit(userName, endpoint);
}; 