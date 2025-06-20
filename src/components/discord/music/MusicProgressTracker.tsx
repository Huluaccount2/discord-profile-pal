
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
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateTime = useRef<number>(Date.now());

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
      setLastProgressUpdate(0);
      lastUpdateTime.current = Date.now();
    }

    const updateProgress = () => {
      const now = Date.now();
      let currentProgress = 0;
      let isCurrentlyPlaying = false;

      // Priority 1: Spotify OAuth integration - completely freeze when paused
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isCurrentlyPlaying = Boolean(spotifyData.isPlaying);
        
        if (isCurrentlyPlaying) {
          // Music is playing - use Spotify's current progress and clear pause state
          currentProgress = spotifyData.track.progress;
          if (pausedAt !== null) {
            console.log('MusicProgressTracker: Music resumed, clearing pause state');
            setPausedAt(null);
          }
          setLastProgressUpdate(currentProgress);
          lastUpdateTime.current = now;
        } else {
          // Music is paused - freeze at the pause position
          if (pausedAt === null) {
            // First time detecting pause - store current Spotify position
            console.log('MusicProgressTracker: Music paused, storing position:', spotifyData.track.progress);
            setPausedAt(spotifyData.track.progress);
          }
          // Always use the stored pause position - DO NOT advance
          currentProgress = pausedAt;
        }
        
        console.log('MusicProgressTracker: Using Spotify OAuth data:', { 
          progress: currentProgress, 
          isPlaying: isCurrentlyPlaying,
          spotifyProgress: spotifyData.track.progress,
          pausedAt,
          frozen: !isCurrentlyPlaying
        });
      } else {
        // Priority 2: Discord fallback - Use progress-based pause detection for Spotify
        const elapsedSinceStart = now - startTime;
        const calculatedProgress = Math.max(0, elapsedSinceStart);
        
        const isSpotifySong = currentSong.name === "Spotify";
        
        // For Spotify songs without OAuth, detect pause by checking if we're stuck at same position
        if (isSpotifySong) {
          const timeSinceLastUpdate = now - lastUpdateTime.current;
          const progressDiff = Math.abs(calculatedProgress - lastProgressUpdate);
          
          // If we haven't moved much in 2+ seconds and we're past the initial buffering
          if (timeSinceLastUpdate > 2000 && progressDiff < 1000 && lastProgressUpdate > 5000) {
            if (pausedAt === null) {
              console.log('MusicProgressTracker: Spotify appears paused, freezing at:', lastProgressUpdate);
              setPausedAt(lastProgressUpdate);
            }
            currentProgress = pausedAt;
            isCurrentlyPlaying = false;
          } else if (pausedAt !== null && progressDiff > 1000) {
            // Progress is advancing again - resume
            console.log('MusicProgressTracker: Spotify resumed, clearing pause state');
            setPausedAt(null);
            currentProgress = calculatedProgress;
            isCurrentlyPlaying = true;
            setLastProgressUpdate(currentProgress);
            lastUpdateTime.current = now;
          } else if (pausedAt !== null) {
            // Still paused
            currentProgress = pausedAt;
            isCurrentlyPlaying = false;
          } else {
            // Normal progression
            currentProgress = calculatedProgress;
            isCurrentlyPlaying = true;
            setLastProgressUpdate(currentProgress);
            lastUpdateTime.current = now;
          }
        } else {
          // Non-Spotify songs - use original logic
          if (pausedAt !== null) {
            currentProgress = pausedAt;
            isCurrentlyPlaying = false;
          } else {
            // Detect stagnation for non-Spotify songs
            const timeSinceLastUpdate = now - lastUpdateTime.current;
            const progressDiff = Math.abs(calculatedProgress - lastProgressUpdate);
            
            if (timeSinceLastUpdate > 3000 && progressDiff < 2000 && lastProgressUpdate > 10000) {
              console.log('MusicProgressTracker: Detected stagnation - likely paused');
              setPausedAt(lastProgressUpdate);
              currentProgress = lastProgressUpdate;
              isCurrentlyPlaying = false;
            } else if (calculatedProgress >= duration) {
              currentProgress = duration;
              isCurrentlyPlaying = false;
              setPausedAt(duration);
            } else {
              currentProgress = calculatedProgress;
              isCurrentlyPlaying = true;
              setLastProgressUpdate(currentProgress);
              lastUpdateTime.current = now;
            }
          }
        }
        
        console.log('MusicProgressTracker: Using Discord timestamps:', { 
          calculatedProgress,
          currentProgress, 
          duration,
          isPlaying: isCurrentlyPlaying,
          pausedAt,
          isSpotifySong,
          timeSinceLastUpdate: now - lastUpdateTime.current,
          progressDiff: Math.abs(calculatedProgress - lastProgressUpdate)
        });
      }

      // Ensure progress is within bounds
      currentProgress = Math.max(0, Math.min(currentProgress, duration));
      
      // Additional validation: if progress is at the end, mark as not playing
      if (currentProgress >= duration * 0.98) {
        isCurrentlyPlaying = false;
      }
      
      // Emit the update
      onProgressUpdate(currentProgress, isCurrentlyPlaying);
    };

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Start with immediate update
    updateProgress();
    
    // Determine interval based on state
    let intervalDuration = 1000; // Default 1 second
    
    if (isSpotifyConnected && spotifyData?.track) {
      const isPlaying = Boolean(spotifyData.isPlaying);
      if (!isPlaying) {
        intervalDuration = 3000; // Check every 3 seconds when paused
        console.log('MusicProgressTracker: Spotify paused, checking every 3 seconds');
      }
    } else if (pausedAt !== null) {
      intervalDuration = 3000; // Check every 3 seconds when paused
      console.log('MusicProgressTracker: Music paused, checking every 3 seconds');
    }
    
    updateIntervalRef.current = setInterval(updateProgress, intervalDuration);

    // Handle visibility changes for more accurate timing
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('MusicProgressTracker: Tab became visible, updating progress');
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
    pausedAt,
    lastProgressUpdate
  ]);
};
