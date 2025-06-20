import { useEffect, useState, useCallback, useRef } from 'react';
import type { DiscordSong } from '@/types/discord';

// Progress tracker with enhanced pause detection for Spotify integration
interface MusicProgressTrackerProps {
  currentSong: DiscordSong | null;
  isPlaying: boolean;
  onProgressUpdate: (progress: { time: number; playing: boolean }) => void;
}

export const MusicProgressTracker = ({
  currentSong,
  isPlaying,
  onProgressUpdate,
}: MusicProgressTrackerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState(isPlaying);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number | null>(null);

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current) return;

    const now = performance.now();
    const elapsedTime = now - startTimeRef.current;
    const newTime = (pauseTimeRef.current || 0) + elapsedTime;

    setCurrentTime(newTime);
    onProgressUpdate({ time: newTime, playing: internalIsPlaying });

    if (internalIsPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [internalIsPlaying, onProgressUpdate, pauseTimeRef]);

  useEffect(() => {
    setInternalIsPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (currentSong) {
      setCurrentTime(0);
      startTimeRef.current = null;
      pauseTimeRef.current = null;
      cancelAnimationFrame(animationFrameRef.current as number);
      animationFrameRef.current = null;
    }
  }, [currentSong]);

  useEffect(() => {
    if (currentSong && internalIsPlaying) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      } else {
        startTimeRef.current = performance.now();
      }
      cancelAnimationFrame(animationFrameRef.current as number);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationFrameRef.current as number);
      animationFrameRef.current = null;
      if (startTimeRef.current) {
        pauseTimeRef.current = currentTime;
        startTimeRef.current = null;
      }
    }
    return () => cancelAnimationFrame(animationFrameRef.current as number);
  }, [internalIsPlaying, currentSong, updateProgress, currentTime]);

  return null;
};
