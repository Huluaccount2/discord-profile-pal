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
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const [songHasEnded, setSongHasEnded] = useState(false);

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
    
    // Create a unique identifier for this song to detect song changes
    const songId = `${currentSong.details}-${currentSong.state}-${startTime}`;
    
    // If this is a new song, reset our cached state
    if (lastSongId !== songId) {
      console.log('MusicProgressTracker: New song detected, resetting state');
      setCachedProgress(0);
      setCachedIsPlaying(true);
      setLastUpdateTime(Date.now());
      setSongHasEnded(false);
    }
    setLastSongId(songId);
    
    console.log('MusicProgressTracker: Setting up progress tracking:', { startTime, endTime, duration, songId });

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
        setSongHasEnded(false);
        
        onProgressUpdate(currentTime, isPlaying);
      } else {
        // Fallback to Discord activity with improved end detection
        const elapsed = now - startTime;
        const songEnded = elapsed >= duration;
        
        if (songEnded && !songHasEnded) {
          // Song just ended - mark it as ended
          console.log('MusicProgressTracker: Song ended');
          setSongHasEnded(true);
          setCachedProgress(duration);
          setCachedIsPlaying(false);
          onProgressUpdate(duration, false);
        } else if (songEnded && songHasEnded) {
          // Song has already ended - keep showing end state
          console.log('MusicProgressTracker: Song still ended, maintaining end state');
          onProgressUpdate(duration, false);
        } else {
          // Song is still playing - calculate current progress
          let isPlaying = true;
          let currentTime = Math.max(0, Math.min(elapsed, duration));
          
          // Check if this looks like a pause based on Discord Rich Presence patterns
          // Discord activities that don't update timestamps often indicate pause
          const timeSinceLastKnownUpdate = now - lastUpdateTime;
          if (timeSinceLastKnownUpdate > 5000) {
            // If we haven't seen an update in 5+ seconds, likely paused
            isPlaying = false;
            currentTime = cachedProgress; // Keep the last known position
          } else {
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
          setSongHasEnded(false);
          onProgressUpdate(currentTime, isPlaying);
        }
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSong, isSpotifyConnected, spotifyData, onProgressUpdate, lastUpdateTime, cachedProgress, lastSongId, songHasEnded]);
};
