
import { useState, useEffect, useRef } from 'react';

interface MusicProgressTrackerProps {
  currentSong: any;
  isSpotifyConnected: boolean;
  spotifyData: any;
  onProgressUpdate: (currentTime: number, isPlaying: boolean) => void;
}

/**
 * Improved pausing logic for music progress:
 * - Spotify integration: trusted isPlaying/track.progress values.
 * - Discord fallback: Pause only if progress hasn't advanced for >2 polling cycles (2s), not just missing timestamp change.
 * - Emits new updates only when time or playing state changes.
 */
export const useMusicProgressTracker = ({
  currentSong,
  isSpotifyConnected,
  spotifyData,
  onProgressUpdate
}: MusicProgressTrackerProps) => {
  // For Discord fallback: Track last progress and polling time to check for stalling
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [cachedProgress, setCachedProgress] = useState(0);
  const [cachedIsPlaying, setCachedIsPlaying] = useState(false);
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const [songHasEnded, setSongHasEnded] = useState(false);

  // New: For "paused" detection (Discord), count repeated progress values
  const lastRawProgressRef = useRef<number | null>(null);
  const progressUnchangedCountRef = useRef<number>(0);

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      onProgressUpdate(0, false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    const songId = `${currentSong.details}-${currentSong.state}-${startTime}`;

    // Song changed: reset
    if (lastSongId !== songId) {
      setCachedProgress(0);
      setCachedIsPlaying(true);
      setLastUpdateTime(Date.now());
      setSongHasEnded(false);
      progressUnchangedCountRef.current = 0;
      lastRawProgressRef.current = null;
    }
    setLastSongId(songId);

    const updateProgress = () => {
      const now = Date.now();

      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        // Use Spotify's real state
        const isPlaying = spotifyData.isPlaying;
        const currentTime = spotifyData.track.progress;

        // Only emit to parent if state or time changed
        if (currentTime !== cachedProgress || isPlaying !== cachedIsPlaying) {
          setCachedProgress(currentTime);
          setCachedIsPlaying(isPlaying);
          setLastUpdateTime(now);
          setSongHasEnded(false);
          onProgressUpdate(currentTime, isPlaying);
        }
        progressUnchangedCountRef.current = 0;
        lastRawProgressRef.current = currentTime;
      } else {
        // Discord fallback: calculate progress from timestamps or detect stall for pause
        const elapsed = now - startTime;
        const songEnded = elapsed >= duration;
        const rawCurrentTime = Math.max(0, Math.min(elapsed, duration));

        if (songEnded && !songHasEnded) {
          setSongHasEnded(true);
          setCachedProgress(duration);
          setCachedIsPlaying(false);
          onProgressUpdate(duration, false);
          progressUnchangedCountRef.current = 0;
          lastRawProgressRef.current = duration;
        } else if (songEnded && songHasEnded) {
          onProgressUpdate(duration, false);
        } else {
          // New: Track if progress is stalling
          let isPlaying = true;
          let currentTime = rawCurrentTime;

          if (lastRawProgressRef.current !== null && currentTime === lastRawProgressRef.current) {
            progressUnchangedCountRef.current += 1;
          } else {
            progressUnchangedCountRef.current = 0;
          }
          lastRawProgressRef.current = currentTime;

          // If progress hasn't advanced for >2 intervals (~2s), treat as paused
          if (progressUnchangedCountRef.current > 2) {
            isPlaying = false;
            currentTime = cachedProgress; // Hold at last known
          } else {
            setCachedProgress(currentTime);
            setLastUpdateTime(now);
          }

          // Only emit if change
          if (currentTime !== cachedProgress || isPlaying !== cachedIsPlaying) {
            setCachedIsPlaying(isPlaying);
            setSongHasEnded(false);
            onProgressUpdate(currentTime, isPlaying);
          }
        }
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [
    currentSong,
    isSpotifyConnected,
    spotifyData,
    onProgressUpdate,
    lastUpdateTime,
    cachedProgress,
    lastSongId,
    songHasEnded,
    cachedIsPlaying,
  ]);
};
