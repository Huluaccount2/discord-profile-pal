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
  const lastKnownTimeRef = useRef<number>(currentSong?.progress || 0);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentSong) return;

    // Reset progress if song changes
    lastKnownTimeRef.current = currentSong.progress || 0;
    lastUpdateRef.current = Date.now();

    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        lastKnownTimeRef.current += elapsed;
        onProgressUpdate({ time: lastKnownTimeRef.current, playing: true });
        lastUpdateRef.current = now;
      }, 200);
    } else {
      // When paused, update one last time to freeze bar
      onProgressUpdate({ time: lastKnownTimeRef.current, playing: false });
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentSong, isPlaying, onProgressUpdate]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
};
