
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
  const startTimeRef = useRef<number>(0);
  const progressAtPauseRef = useRef<number>(0);

  useEffect(() => {
    if (!currentSong?.timestamps) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying) {
      // Calculate current progress when resuming
      const now = Date.now();
      const songStart = currentSong.timestamps.start;
      let currentProgress = now - songStart;

      // If we were paused, add the paused progress to the current time
      if (progressAtPauseRef.current > 0) {
        const timeSincePause = now - startTimeRef.current;
        currentProgress = progressAtPauseRef.current;
        // Update the song start time to account for the pause
        currentSong.timestamps.start = now - progressAtPauseRef.current;
      }

      startTimeRef.current = now;

      // Start interval to update progress
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const totalProgress = progressAtPauseRef.current + elapsed;
        onProgressUpdate({ time: totalProgress, playing: true });
      }, 100);

      // Send immediate update
      onProgressUpdate({ time: currentProgress, playing: true });
    } else {
      // Music is paused - freeze the progress
      const now = Date.now();
      if (startTimeRef.current > 0) {
        const elapsed = now - startTimeRef.current;
        progressAtPauseRef.current = progressAtPauseRef.current + elapsed;
      } else {
        // First time pause - calculate from song start
        progressAtPauseRef.current = now - currentSong.timestamps.start;
      }
      
      onProgressUpdate({ time: progressAtPauseRef.current, playing: false });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSong, isPlaying, onProgressUpdate]);

  // Reset progress when song changes
  useEffect(() => {
    progressAtPauseRef.current = 0;
    startTimeRef.current = 0;
  }, [currentSong?.details, currentSong?.state]); // Reset when song changes

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
};
