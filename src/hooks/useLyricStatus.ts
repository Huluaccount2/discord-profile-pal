
import { useState, useEffect, useCallback } from 'react';
import { useDeskThing } from '@/contexts/DeskThingContext';
import { CurrentLyric } from '@/components/discord/LyricDisplay';

// Mock lyric monitor for compatibility
const mockLyricStatusMonitor = {
  startMonitoring: (callback: (lyric: CurrentLyric | null) => void) => {
    console.log('Mock lyric monitoring started');
  },
  stopMonitoring: () => {
    console.log('Mock lyric monitoring stopped');
  },
  setCacheDirectory: (path: string) => {
    console.log('Mock cache directory set:', path);
  }
};

export const useLyricStatus = () => {
  const [currentLyric, setCurrentLyric] = useState<CurrentLyric | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isRunningOnDeskThing, sendLog, sendError } = useDeskThing();

  const handleLyricUpdate = useCallback((lyric: CurrentLyric | null) => {
    setCurrentLyric(lyric);
    setIsActive(lyric !== null);
    
    if (lyric) {
      console.log('useLyricStatus: Current lyric updated:', lyric.text);
      sendLog('info', 'Lyric updated', { text: lyric.text, progress: lyric.progress });
    } else {
      console.log('useLyricStatus: No current lyric');
    }
  }, [sendLog]);

  const handleError = useCallback((error: Error) => {
    console.error('useLyricStatus: Error occurred:', error);
    setError(error.message);
    sendError(error, 'LyricStatusMonitor');
  }, [sendError]);

  useEffect(() => {
    // Only start monitoring if we're running on DeskThing (has file system access)
    if (isRunningOnDeskThing) {
      console.log('useLyricStatus: Starting Lyric Status file monitoring on DeskThing');
      sendLog('info', 'Starting Lyric Status file monitoring');
      
      try {
        mockLyricStatusMonitor.startMonitoring(handleLyricUpdate);
        setIsMonitoring(true);
        setError(null);
      } catch (error) {
        const err = error as Error;
        console.error('useLyricStatus: Failed to start monitoring:', err);
        handleError(err);
      }

      return () => {
        console.log('useLyricStatus: Stopping Lyric Status file monitoring');
        sendLog('info', 'Stopping Lyric Status file monitoring');
        mockLyricStatusMonitor.stopMonitoring();
        setIsMonitoring(false);
        setIsActive(false);
        setCurrentLyric(null);
        setError(null);
      };
    } else {
      console.log('useLyricStatus: Not running on DeskThing, file monitoring unavailable');
      setIsMonitoring(false);
      setIsActive(false);
      setCurrentLyric(null);
      setError('File monitoring requires DeskThing environment');
    }
  }, [isRunningOnDeskThing, handleLyricUpdate, handleError, sendLog]);

  // Method to manually update cache directory
  const setCacheDirectory = useCallback((path: string) => {
    if (isRunningOnDeskThing) {
      mockLyricStatusMonitor.setCacheDirectory(path);
      sendLog('info', 'Cache directory updated', { path });
    }
  }, [isRunningOnDeskThing, sendLog]);

  return {
    currentLyric,
    isActive,
    isMonitoring,
    error,
    setCacheDirectory
  };
};
