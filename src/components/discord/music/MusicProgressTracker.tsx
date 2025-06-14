
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
  useEffect(() => {
    console.log('MusicProgressTracker: Setting up progress tracking effect');
    
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      console.log('MusicProgressTracker: No valid timestamps found, using current state');
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    
    console.log('MusicProgressTracker: Setting up progress tracking:', { startTime, endTime, duration });

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData) {
        console.log('MusicProgressTracker: Using Spotify OAuth state:', {
          isPlaying: spotifyData.isPlaying,
          progress: spotifyData.track?.progress
        });
        
        if (spotifyData.track) {
          onProgressUpdate(spotifyData.track.progress, spotifyData.isPlaying);
        }
      } else {
        const currentPlayingState = elapsed >= 0 && elapsed <= duration;
        console.log('MusicProgressTracker: Using Discord activity state:', {
          elapsed,
          duration,
          isPlaying: currentPlayingState
        });
        
        const currentTime = Math.max(0, Math.min(elapsed, duration));
        onProgressUpdate(currentTime, currentPlayingState);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSong, isSpotifyConnected, spotifyData, onProgressUpdate]);
};
