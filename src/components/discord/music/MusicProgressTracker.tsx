
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
        // Priority 2: Discord fallback with improved stagnation detection
        const elapsedSinceStart = now - startTime;
        const calculatedProgress = Math.max(0, elapsedSinceStart);
        
        // Check if we have a paused state
        if (pausedAt !== null) {
          currentProgress = pausedAt;
          isCurrentlyPlaying = false;
          console.log('MusicProgressTracker: Using paused state:', pausedAt);
        } else {
          // Detect if progress has stagnated (indicating pause)
          const timeSinceLastUpdate = now - lastUpdateTime.current;
          const progressDiff = Math.abs(calculatedProgress - lastProgressUpdate);
          
          // If more than 3 seconds have passed and progress hasn't advanced significantly
          if (timeSinceLastUpdate > 3000 && progressDiff < 2000 && lastProgressUpdate > 10000) {
            console.log('MusicProgressTracker: Detected stagnation - likely paused');
            setPausedAt(lastProgressUpdate);
            currentProgress = lastProgressUpdate;
            isCurrentlyPlaying = false;
          } else if (calculatedProgress >= duration) {
            // Song has ended
            currentProgress = duration;
            isCurrentlyPlaying = false;
            setPausedAt(duration);
          } else {
            // Normal playback
            currentProgress = calculatedProgress;
            isCurrentlyPlaying = true;
            setLastProgressUpdate(currentProgress);
            lastUpdateTime.current = now;
          }
        }
        
        console.log('MusicProgressTracker: Using Discord timestamps:', { 
          calculatedProgress,
          currentProgress, 
          duration,
          isPlaying: isCurrentlyPlaying,
          pausedAt,
          timeSinceLastUpdate: now - lastUpdateTime.current
        });
      }

      // Ensure progress is within bounds
      currentProgress = Math.max(0, Math.min(currentProgress, duration));
      
      // Additional validation: if progress is at the end, mark as not playing
      if (currentProgress >= duration * 0.98) { // 98% to account for small timing differences
        isCurrentlyPlaying = false;
      }
      
      // Emit the update - currentProgress is frozen when paused
      onProgressUpdate(currentProgress, isCurrentlyPlaying);
    };

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Start with immediate update
    updateProgress();
    
    // Determine if we should start an interval based on playing state
    let shouldStartInterval = true;
    let intervalDuration = 1000; // Default 1 second
    
    if (isSpotifyConnected && spotifyData?.track) {
      const isPlaying = Boolean(spotifyData.isPlaying);
      if (!isPlaying) {
        // Music is paused - only check every 5 seconds for resume
        intervalDuration = 5000;
        console.log('MusicProgressTracker: Music paused, checking every 5 seconds for resume');
      } else {
        console.log('MusicProgressTracker: Music playing, updating every second');
      }
    } else if (pausedAt !== null) {
      // Discord music is paused - check every 5 seconds
      intervalDuration = 5000;
      console.log('MusicProgressTracker: Discord music paused, checking every 5 seconds');
    }
    
    if (shouldStartInterval) {
      updateIntervalRef.current = setInterval(updateProgress, intervalDuration);
    }

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
