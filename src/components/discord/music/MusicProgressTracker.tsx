import { useState, useEffect, useRef } from 'react';

interface MusicProgressTrackerProps {
  currentSong: any;
  isSpotifyConnected: boolean;
  spotifyData: any;
  onProgressUpdate: (currentTime: number, isPlaying: boolean) => void;
}

/**
 * Ensures music progress properly FREEZES when paused (for both Spotify/OAuth and Discord fallback):
 * - When paused (Spotify isPlaying = false, or Discord 'stall'), always emit the exact frozen progress,
 *   never let the timer advance until play resumes.
 */
export const useMusicProgressTracker = ({
  currentSong,
  isSpotifyConnected,
  spotifyData,
  onProgressUpdate
}: MusicProgressTrackerProps) => {
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [cachedProgress, setCachedProgress] = useState(0);
  const [cachedIsPlaying, setCachedIsPlaying] = useState(false);
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const [songHasEnded, setSongHasEnded] = useState(false);

  const lastRawProgressRef = useRef<number | null>(null);
  const progressUnchangedCountRef = useRef<number>(0);
  // NEW: When paused, freeze progress at this value
  const frozenProgressRef = useRef<number>(0);

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      onProgressUpdate(0, false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    const songId = `${currentSong.details}-${currentSong.state}-${startTime}`;

    // Song changed: reset everything
    if (lastSongId !== songId) {
      setCachedProgress(0);
      setCachedIsPlaying(true);
      setLastUpdateTime(Date.now());
      setSongHasEnded(false);
      progressUnchangedCountRef.current = 0;
      lastRawProgressRef.current = null;
      frozenProgressRef.current = 0;
    }
    setLastSongId(songId);

    const updateProgress = () => {
      const now = Date.now();

      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        // Use true Spotify state and progress.
        const isPlaying = spotifyData.isPlaying;
        const currentTime = spotifyData.track.progress;

        if (isPlaying) {
          frozenProgressRef.current = currentTime;
        }
        // If NOT playing, freeze at last progress (do NOT advance)
        const effectiveTime = isPlaying ? currentTime : frozenProgressRef.current ?? currentTime;

        // Only emit to parent if value or state changed
        if (effectiveTime !== cachedProgress || isPlaying !== cachedIsPlaying) {
          setCachedProgress(effectiveTime);
          setCachedIsPlaying(isPlaying);
          setLastUpdateTime(now);
          setSongHasEnded(false);
          onProgressUpdate(effectiveTime, isPlaying);
        }
        // Always cache the frozen progress the moment it is paused
        if (!isPlaying) {
          frozenProgressRef.current = currentTime;
        }
        progressUnchangedCountRef.current = 0;
        lastRawProgressRef.current = currentTime;
      } else {
        // Discord fallback: calculate progress OR freeze if stalled
        const elapsed = now - startTime;
        const songEnded = elapsed >= duration;
        const rawCurrentTime = Math.max(0, Math.min(elapsed, duration));

        if (songEnded && !songHasEnded) {
          setSongHasEnded(true);
          setCachedProgress(duration);
          setCachedIsPlaying(false);
          frozenProgressRef.current = duration;
          onProgressUpdate(duration, false);
          progressUnchangedCountRef.current = 0;
          lastRawProgressRef.current = duration;
        } else if (songEnded && songHasEnded) {
          onProgressUpdate(duration, false);
        } else {
          let isPlaying = true;
          let currentTime = rawCurrentTime;

          if (lastRawProgressRef.current !== null && currentTime === lastRawProgressRef.current) {
            progressUnchangedCountRef.current += 1;
          } else {
            progressUnchangedCountRef.current = 0;
          }
          lastRawProgressRef.current = currentTime;

          // If progress hasn't advanced for >2 intervals (~2s), treat as paused and freeze time at last known
          if (progressUnchangedCountRef.current > 2) {
            isPlaying = false;
            // FREEZE: don't let currentTime increment, just return frozen
            currentTime = frozenProgressRef.current ?? cachedProgress;
            frozenProgressRef.current = currentTime;
          } else {
            // In playing state, update frozenProgressRef every time
            frozenProgressRef.current = currentTime;
            setCachedProgress(currentTime);
            setLastUpdateTime(now);
          }

          // Only emit to parent if changed
          if (currentTime !== cachedProgress || isPlaying !== cachedIsPlaying) {
            setCachedIsPlaying(isPlaying);
            setSongHasEnded(false);
            setCachedProgress(currentTime);
            onProgressUpdate(currentTime, isPlaying);
          } else if (!isPlaying) {
            // Forced: When paused, keep emitting frozen
            onProgressUpdate(frozenProgressRef.current ?? cachedProgress, false);
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
