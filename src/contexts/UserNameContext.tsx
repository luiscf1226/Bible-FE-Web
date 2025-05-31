"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NameInput from '@/components/NameInput';

interface UserNameContextType {
  userName: string | null;
  setUserName: (name: string) => void;
}

const UserNameContext = createContext<UserNameContextType | undefined>(undefined);

export function UserNameProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    // Check session storage on mount
    const storedName = sessionStorage.getItem('userName');
    if (storedName) {
      setUserNameState(storedName);
    } else {
      setShowNameInput(true);
    }
  }, []);

  const setUserName = (name: string) => {
    sessionStorage.setItem('userName', name);
    setUserNameState(name);
    setShowNameInput(false);
  };

  return (
    <UserNameContext.Provider value={{ userName, setUserName }}>
      {children}
      {showNameInput && <NameInput onNameSubmit={setUserName} />}
    </UserNameContext.Provider>
  );
}

export function useUserName() {
  const context = useContext(UserNameContext);
  if (context === undefined) {
    throw new Error('useUserName must be used within a UserNameProvider');
  }
  return context;
} 