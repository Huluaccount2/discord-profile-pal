
import { useEffect, useRef } from 'react';

interface MusicProgressTrackerProps {
  currentSong: any;
  isPlaying: boolean;
  onProgressUpdate: (progress: { time: number; playing: boolean }) => void;
}

export const MusicProgressTracker: React.FC<MusicProgressTrackerProps> = ({
  currentSong,
  isPlaying,
  onProgressUpdate,
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSongRef = useRef<string | null>(null);
  const progressRef = useRef<number>(0);

  // Clear interval helper
  const clearCurrentInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Calculate initial progress based on song source
  const calculateInitialProgress = () => {
    if (!currentSong?.timestamps) return 0;

    const now = Date.now();
    
    // For Spotify, use the provided progress directly
    if (currentSong.name === "Spotify" && currentSong.progress !== undefined) {
      return currentSong.progress;
    }
    
    // For Discord, calculate from timestamps
    if (currentSong.timestamps.start) {
      return Math.max(0, now - currentSong.timestamps.start);
    }
    
    return 0;
  };

  // Check if this is a new song
  const getCurrentSongId = () => {
    if (!currentSong) return null;
    return `${currentSong.details || ''}-${currentSong.state || ''}-${currentSong.name || ''}`;
  };

  useEffect(() => {
    if (!currentSong) {
      clearCurrentInterval();
      return;
    }

    const currentSongId = getCurrentSongId();
    const isNewSong = currentSongId !== lastSongRef.current;
    
    // Clear any existing interval
    clearCurrentInterval();

    if (isNewSong) {
      // New song - reset progress
      progressRef.current = calculateInitialProgress();
      lastSongRef.current = currentSongId;
      console.log('MusicProgressTracker: New song detected, initial progress:', progressRef.current);
    }

    // Send current progress immediately
    onProgressUpdate({ 
      time: progressRef.current, 
      playing: isPlaying 
    });

    if (isPlaying) {
      // Start interval to update progress
      intervalRef.current = setInterval(() => {
        progressRef.current += 100; // Add 100ms each interval
        onProgressUpdate({ 
          time: progressRef.current, 
          playing: true 
        });
      }, 100);
    }

    return clearCurrentInterval;
  }, [currentSong, isPlaying, onProgressUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return clearCurrentInterval;
  }, []);

  return null;
};
