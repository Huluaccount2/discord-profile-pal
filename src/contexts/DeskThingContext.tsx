
import React, { createContext, useContext, useEffect, useState } from 'react';
import { deskthingIntegration } from '@/utils/deskthing';

interface DeskThingContextType {
  isConnected: boolean;
  isRunningOnDeskThing: boolean;
  sendLog: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
  sendError: (error: Error, context?: string) => void;
}

const DeskThingContext = createContext<DeskThingContextType | undefined>(undefined);

export const DeskThingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunningOnDeskThing] = useState(() => {
    // Initialize this immediately to avoid context dependency issues
    return typeof window !== 'undefined' && 
           typeof (window as any).DeskThing !== 'undefined';
  });

  useEffect(() => {
    if (isRunningOnDeskThing) {
      // Initialize DeskThing integration
      deskthingIntegration.initialize();

      // Set up connection status monitoring
      const checkConnection = () => {
        setIsConnected(deskthingIntegration.getConnectionStatus());
      };

      // Check connection status periodically
      const interval = setInterval(checkConnection, 1000);
      checkConnection(); // Initial check

      return () => clearInterval(interval);
    } else {
      console.log('DeskThing: Running in standalone web mode');
    }
  }, [isRunningOnDeskThing]);

  const sendLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    if (isRunningOnDeskThing) {
      deskthingIntegration.sendLog(level, message, data);
    } else {
      console.log(`[${level}] ${message}`, data);
    }
  };

  const sendError = (error: Error, context?: string) => {
    if (isRunningOnDeskThing) {
      deskthingIntegration.sendError(error, context);
    } else {
      console.error('Error:', error, context);
    }
  };

  return (
    <DeskThingContext.Provider
      value={{
        isConnected,
        isRunningOnDeskThing,
        sendLog,
        sendError,
      }}
    >
      {children}
    </DeskThingContext.Provider>
  );
};

export const useDeskThing = () => {
  const context = useContext(DeskThingContext);
  if (context === undefined) {
    throw new Error('useDeskThing must be used within a DeskThingProvider');
  }
  return context;
};
