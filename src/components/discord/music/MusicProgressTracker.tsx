
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
        
        console.log('MusicProgressTracker: Using Spotify data:', { 
          progress: currentProgress, 
          isPlaying: isCurrentlyPlaying 
        });
      } else {
        // Priority 2: Discord fallback - calculate based on timestamps
        const elapsedSinceStart = now - startTime;
        currentProgress = Math.max(0, elapsedSinceStart);
        
        // Check if song should have ended
        if (currentProgress >= duration) {
          currentProgress = duration;
          isCurrentlyPlaying = false;
        }
        
        console.log('MusicProgressTracker: Using Discord timestamps:', { 
          now, 
          startTime, 
          elapsedSinceStart: currentProgress, 
          duration,
          isPlaying: isCurrentlyPlaying 
        });
      }

      // Ensure progress is within bounds
      currentProgress = Math.max(0, Math.min(currentProgress, duration));
      
      // Emit the update
      onProgressUpdate(currentProgress, isCurrentlyPlaying);
    };

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Start with immediate update
    updateProgress();
    
    // Set up updates every 100ms for smooth progress bar movement
    updateIntervalRef.current = setInterval(updateProgress, 100);

    // Handle visibility changes for more accurate timing
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
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
