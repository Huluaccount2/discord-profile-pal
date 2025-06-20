import React, { useEffect, useRef } from 'react';

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
  const lastKnownTimeRef = useRef<number>(currentSong?.progress || 0);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentSong) return;

    // Reset progress if song changes
    lastKnownTimeRef.current = currentSong.progress || 0;
    lastUpdateRef.current = Date.now();

    // Cleanup old interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isPlaying) {
      // Start interval to update progress
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        lastKnownTimeRef.current += elapsed;
        onProgressUpdate({ time: lastKnownTimeRef.current, playing: true });
        lastUpdateRef.current = now;
      }, 200);
    } else {
      // When paused, do a one-time update with the latest known time
      onProgressUpdate({ time: lastKnownTimeRef.current, playing: false });
    }

    // Cleanup on unmount or deps change
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentSong, isPlaying, onProgressUpdate]);

  // Clean up on unmount (extra safety)
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
};
