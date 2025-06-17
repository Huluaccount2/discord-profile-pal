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
  const [pausedAt, setPausedAt] = useState<number | null>(null);
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
      setPausedAt(null);
    }

    const updateProgress = () => {
      const now = Date.now();
      let currentProgress = 0;
      let isCurrentlyPlaying = true;

      // Priority 1: Spotify OAuth integration
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isCurrentlyPlaying = Boolean(spotifyData.isPlaying);
        
        if (isCurrentlyPlaying) {
          // Music is playing - use Spotify's progress
          currentProgress = spotifyData.track.progress;
          setPausedAt(null);
        } else {
          // Music is paused - use last known progress or Spotify's paused progress
          currentProgress = spotifyData.track.progress;
          setPausedAt(currentProgress);
        }
        
        console.log('MusicProgressTracker: Using Spotify data:', { 
          progress: currentProgress, 
          isPlaying: isCurrentlyPlaying,
          pausedAt 
        });
      } else {
        // Priority 2: Discord fallback - calculate based on timestamps
        if (pausedAt !== null) {
          // We're paused, keep showing the paused progress
          currentProgress = pausedAt;
          isCurrentlyPlaying = false;
        } else {
          // Normal playback calculation
          const elapsedSinceStart = now - startTime;
          currentProgress = Math.max(0, elapsedSinceStart);
          
          // Check if song should have ended
          if (currentProgress >= duration) {
            currentProgress = duration;
            isCurrentlyPlaying = false;
          }
        }
        
        console.log('MusicProgressTracker: Using Discord timestamps:', { 
          now, 
          startTime, 
          currentProgress, 
          duration,
          isPlaying: isCurrentlyPlaying,
          pausedAt
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
    
    // Determine if music is playing
    let isPlaying = true;
    if (isSpotifyConnected && spotifyData?.track) {
      isPlaying = Boolean(spotifyData.isPlaying);
    }
    
    if (isPlaying && pausedAt === null) {
      // Set up updates every 100ms for smooth progress animation only when playing
      updateIntervalRef.current = setInterval(updateProgress, 100);
      console.log('MusicProgressTracker: Started progress interval - music is playing');
    } else {
      console.log('MusicProgressTracker: Not starting interval - music is paused or stopped');
    }

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
    currentSong?.details,
    currentSong?.state,
    currentSong?.timestamps?.start,
    currentSong?.timestamps?.end,
    isSpotifyConnected,
    spotifyData?.isPlaying,
    spotifyData?.track?.progress,
    onProgressUpdate,
    pausedAt
  ]);
};
