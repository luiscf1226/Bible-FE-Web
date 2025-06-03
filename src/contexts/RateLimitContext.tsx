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

  const checkEndpointLimit = (endpoint: string) => {
    if (!userName) {
      return { isLimited: false };
    }
    return checkRateLimit(userName, endpoint);
  };

  const incrementEndpointLimit = (endpoint: string) => {
    if (!userName) {
      return;
    }
    incrementRateLimit(userName, endpoint);
  };

  const getEndpointRemainingRequests = (endpoint: string) => {
    if (!userName) {
      return 5;
    }
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
  const { isLimited, remainingTime } = checkRateLimit(userName, endpoint);
  
  if (isLimited && rateLimitFunctions) {
    rateLimitFunctions.setRateLimitInfo({ remainingTime: remainingTime!, endpoint });
    rateLimitFunctions.setShowRateLimitAlert(true);
    return true;
  }
  
  return false;
};

export const incrementRateLimitCount = (endpoint: string, userName: string) => {
  incrementRateLimit(userName, endpoint);
}; 