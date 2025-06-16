
import { useState, useEffect, useRef } from 'react';

interface MusicProgressTrackerProps {
  currentSong: any;
  isSpotifyConnected: boolean;
  spotifyData: any;
  onProgressUpdate: (currentTime: number, isPlaying: boolean) => void;
}

export const useMusicProgressTracker = ({
  currentSong,
  isSpotifyConnected,
  spotifyData,
  onProgressUpdate
}: MusicProgressTrackerProps) => {
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const cachedProgressRef = useRef(0);
  const cachedIsPlayingRef = useRef(false);
  const cachedSongHasEndedRef = useRef(false);
  const lastEmittedProgressRef = useRef(0);
  const updateProgressRef = useRef<() => void>();

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      onProgressUpdate(0, false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    const songId = `${currentSong.details}-${currentSong.state}-${startTime}`;

    // Reset state when song changes
    if (lastSongId !== songId) {
      console.log('MusicProgressTracker: Song changed from', lastSongId, 'to', songId);
      cachedProgressRef.current = 0;
      cachedIsPlayingRef.current = true;
      cachedSongHasEndedRef.current = false;
      lastEmittedProgressRef.current = 0;
      setLastSongId(songId);
    }

    const updateProgress = () => {
      const now = Date.now();
      let isPlaying = true;
      let progressValue = 0;

      // Spotify OAuth integration takes priority
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isPlaying = Boolean(spotifyData.isPlaying);
        progressValue = spotifyData.track.progress;

        if (isPlaying) {
          // Update cached progress when playing
          cachedProgressRef.current = progressValue;
          cachedIsPlayingRef.current = true;
          onProgressUpdate(progressValue, true);
          lastEmittedProgressRef.current = progressValue;
        } else {
          // Use frozen progress when paused
          onProgressUpdate(cachedProgressRef.current, false);
          cachedIsPlayingRef.current = false;
        }
        return;
      }

      // Discord fallback - calculate elapsed time
      const elapsed = now - startTime;
      const discordSongEnded = elapsed >= duration;

      if (discordSongEnded && !cachedSongHasEndedRef.current) {
        cachedProgressRef.current = duration;
        cachedIsPlayingRef.current = false;
        cachedSongHasEndedRef.current = true;
        onProgressUpdate(duration, false);
        lastEmittedProgressRef.current = duration;
      } else if (discordSongEnded && cachedSongHasEndedRef.current) {
        onProgressUpdate(duration, false);
      } else {
        const computedProgress = Math.max(0, Math.min(elapsed, duration));
        
        // Check if progress is advancing (song is playing)
        if (cachedIsPlayingRef.current && computedProgress !== lastEmittedProgressRef.current) {
          isPlaying = true;
          progressValue = computedProgress;
          cachedProgressRef.current = progressValue;
          cachedIsPlayingRef.current = true;
          onProgressUpdate(progressValue, true);
          lastEmittedProgressRef.current = progressValue;
        } else if (!cachedIsPlayingRef.current || computedProgress === lastEmittedProgressRef.current) {
          // Progress stuck (paused) - emit frozen progress
          isPlaying = false;
          onProgressUpdate(cachedProgressRef.current, false);
          cachedIsPlayingRef.current = false;
        }
      }
    };

    updateProgressRef.current = updateProgress;

    updateProgress();
    const interval = setInterval(updateProgress, 1000); // Update every second

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && updateProgressRef.current) {
        updateProgressRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    currentSong,
    isSpotifyConnected,
    spotifyData,
    onProgressUpdate,
    lastSongId,
  ]);
};
