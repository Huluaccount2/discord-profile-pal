import { useState, useEffect } from 'react';

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
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [cachedProgress, setCachedProgress] = useState(0);
  const [cachedIsPlaying, setCachedIsPlaying] = useState(false);

  useEffect(() => {
    console.log('MusicProgressTracker: Setting up progress tracking effect');
    
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      console.log('MusicProgressTracker: No valid timestamps found');
      onProgressUpdate(0, false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    
    console.log('MusicProgressTracker: Setting up progress tracking:', { startTime, endTime, duration });

    const updateProgress = () => {
      const now = Date.now();
      
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        console.log('MusicProgressTracker: Using Spotify OAuth state:', {
          isPlaying: spotifyData.isPlaying,
          progress: spotifyData.track.progress
        });
        
        const isPlaying = spotifyData.isPlaying;
        const currentTime = spotifyData.track.progress;
        
        // Update our cached values
        setCachedProgress(currentTime);
        setCachedIsPlaying(isPlaying);
        setLastUpdateTime(now);
        
        onProgressUpdate(currentTime, isPlaying);
      } else {
        // Fallback to Discord activity with improved pause detection
        const elapsed = now - startTime;
        const songEnded = elapsed >= duration;
        
        // If we have cached data and it was paused, keep it paused unless song ended
        let isPlaying = !songEnded && elapsed >= 0;
        let currentTime = Math.max(0, Math.min(elapsed, duration));
        
        // Check if this looks like a pause based on Discord Rich Presence patterns
        // Discord activities that don't update timestamps often indicate pause
        const timeSinceLastKnownUpdate = now - lastUpdateTime;
        if (timeSinceLastKnownUpdate > 5000 && !songEnded) {
          // If we haven't seen an update in 5+ seconds and song hasn't ended, likely paused
          isPlaying = false;
          currentTime = cachedProgress; // Keep the last known position
        } else if (!songEnded) {
          // Update cached progress for future pause detection
          setCachedProgress(currentTime);
          setLastUpdateTime(now);
        }
        
        console.log('MusicProgressTracker: Using Discord activity state:', {
          elapsed,
          duration,
          isPlaying,
          currentTime,
          songEnded,
          timeSinceLastKnownUpdate
        });
        
        setCachedIsPlaying(isPlaying);
        onProgressUpdate(currentTime, isPlaying);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSong, isSpotifyConnected, spotifyData, onProgressUpdate, lastUpdateTime, cachedProgress]);
};
