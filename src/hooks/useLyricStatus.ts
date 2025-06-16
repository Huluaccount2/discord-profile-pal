
import { useState, useEffect, useCallback } from 'react';
import { lyricStatusMonitor, CurrentLyric } from '@/services/LyricStatusMonitor';
import { useDeskThing } from '@/contexts/DeskThingContext';

export const useLyricStatus = () => {
  const [currentLyric, setCurrentLyric] = useState<CurrentLyric | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { isRunningOnDeskThing } = useDeskThing();

  const handleLyricUpdate = useCallback((lyric: CurrentLyric | null) => {
    setCurrentLyric(lyric);
    setIsActive(lyric !== null);
    
    if (lyric) {
      console.log('useLyricStatus: Current lyric updated:', lyric.text);
    }
  }, []);

  useEffect(() => {
    // Only start monitoring if we're running on DeskThing (has file system access)
    if (isRunningOnDeskThing) {
      console.log('useLyricStatus: Starting Lyric Status monitoring');
      lyricStatusMonitor.startMonitoring(handleLyricUpdate);

      return () => {
        console.log('useLyricStatus: Stopping Lyric Status monitoring');
        lyricStatusMonitor.stopMonitoring();
      };
    } else {
      console.log('useLyricStatus: Not running on DeskThing, file monitoring unavailable');
    }
  }, [isRunningOnDeskThing, handleLyricUpdate]);

  return {
    currentLyric,
    isActive,
    isMonitoring: lyricStatusMonitor.isActive()
  };
};
