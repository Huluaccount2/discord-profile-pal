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
  const lastUpdateTimeRef = useRef(0);
  const cachedProgressRef = useRef(0);
  const isPlayingRef = useRef(false);
  const songStartTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

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
      console.log('MusicProgressTracker: Song changed, resetting state');
      cachedProgressRef.current = 0;
      isPlayingRef.current = true;
      songStartTimeRef.current = Date.now();
      pausedAtRef.current = 0;
      lastUpdateTimeRef.current = Date.now();
      setLastSongId(songId);
    }

    const updateProgress = () => {
      const now = Date.now();
      let currentProgress = 0;
      let isCurrentlyPlaying = true;

      // Priority 1: Spotify OAuth integration
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isCurrentlyPlaying = Boolean(spotifyData.isPlaying);
        currentProgress = spotifyData.track.progress;

        if (isCurrentlyPlaying) {
          // When playing, update our tracking references
          isPlayingRef.current = true;
          cachedProgressRef.current = currentProgress;
          lastUpdateTimeRef.current = now;
        } else {
          // When paused, freeze at last known position
          isPlayingRef.current = false;
          currentProgress = cachedProgressRef.current;
        }

        onProgressUpdate(currentProgress, isCurrentlyPlaying);
        return;
      }

      // Priority 2: Discord fallback with improved timing
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      if (isPlayingRef.current) {
        // If we were playing, add elapsed time to cached progress
        cachedProgressRef.current += timeSinceLastUpdate;
        currentProgress = cachedProgressRef.current;
        
        // Check if song should have ended
        if (currentProgress >= duration) {
          currentProgress = duration;
          isCurrentlyPlaying = false;
          isPlayingRef.current = false;
        }
      } else {
        // If we were paused, keep the same progress
        currentProgress = cachedProgressRef.current;
        isCurrentlyPlaying = false;
      }

      // Update our tracking time
      lastUpdateTimeRef.current = now;
      
      // Emit the update
      onProgressUpdate(Math.max(0, Math.min(currentProgress, duration)), isCurrentlyPlaying);
    };

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Start with immediate update
    updateProgress();
    
    // Set up more frequent updates for smoother progress (250ms)
    updateIntervalRef.current = setInterval(updateProgress, 250);

    // Handle visibility changes for more accurate timing
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastUpdateTimeRef.current = Date.now();
        updateProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
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
