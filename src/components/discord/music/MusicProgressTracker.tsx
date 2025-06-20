
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

      // Priority 1: Spotify OAuth integration with proper pause handling
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isCurrentlyPlaying = Boolean(spotifyData.isPlaying);
        
        if (isCurrentlyPlaying) {
          // Music is playing - use Spotify's progress as base, don't add time
          currentProgress = spotifyData.track.progress;
          setPausedAt(null);
          setLastProgressUpdate(currentProgress);
          lastUpdateTime.current = now;
        } else {
          // Music is paused - use the exact progress from Spotify and freeze it
          currentProgress = spotifyData.track.progress;
          // Don't update pausedAt continuously, just use Spotify's current progress
        }
        
        console.log('MusicProgressTracker: Using Spotify OAuth data:', { 
          progress: currentProgress, 
          isPlaying: isCurrentlyPlaying,
          spotifyProgress: spotifyData.track.progress
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
      
      // Emit the update
      onProgressUpdate(currentProgress, isCurrentlyPlaying);
    };

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Start with immediate update
    updateProgress();
    
    // Determine update frequency based on playing state
    let isPlaying = true;
    if (isSpotifyConnected && spotifyData?.track) {
      isPlaying = Boolean(spotifyData.isPlaying);
    } else if (pausedAt !== null) {
      isPlaying = false;
    }
    
    if (isPlaying) {
      // Update every 1000ms when playing - don't advance time artificially
      updateIntervalRef.current = setInterval(updateProgress, 1000);
      console.log('MusicProgressTracker: Started progress interval - music is playing');
    } else {
      // Update every 2 seconds when paused to check for resume
      updateIntervalRef.current = setInterval(updateProgress, 2000);
      console.log('MusicProgressTracker: Started check interval - music is paused');
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
