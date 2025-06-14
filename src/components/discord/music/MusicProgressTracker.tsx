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
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [cachedProgress, setCachedProgress] = useState(0);
  const [cachedIsPlaying, setCachedIsPlaying] = useState(false);
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const [songHasEnded, setSongHasEnded] = useState(false);

  // New: Track previous Discord activity timestamp for pausing detection
  const prevTimestampsRef = useRef<{start?: number; end?: number} | null>(null);
  const prevIsPlayingRef = useRef<boolean>(false);

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

    // If this is a new song, reset our cached state & tracker refs
    if (lastSongId !== songId) {
      console.log('MusicProgressTracker: New song detected, resetting state');
      setCachedProgress(0);
      setCachedIsPlaying(true);
      setLastUpdateTime(Date.now());
      setSongHasEnded(false);
      prevTimestampsRef.current = { start: startTime, end: endTime };
      prevIsPlayingRef.current = true;
    }
    setLastSongId(songId);

    console.log('MusicProgressTracker: Setting up progress tracking:', { startTime, endTime, duration, songId });

    const updateProgress = () => {
      const now = Date.now();

      // --- SPOTIFY-OAUTH MODE ---
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        console.log('MusicProgressTracker: Using Spotify OAuth state:', {
          isPlaying: spotifyData.isPlaying,
          progress: spotifyData.track.progress
        });

        const isPlaying = spotifyData.isPlaying;
        const currentTime = spotifyData.track.progress;

        setCachedProgress(currentTime); // ms
        setCachedIsPlaying(isPlaying);
        setLastUpdateTime(now);
        setSongHasEnded(currentTime >= spotifyData.track.duration);

        onProgressUpdate(currentTime, isPlaying);

        // Track previous pause/play state so Discord fallback works consistently after song source switches
        prevIsPlayingRef.current = isPlaying;
        // Reset Discord pause detection "stall" every time Spotify data updates
        prevTimestampsRef.current = null;
        return;
      }

      // --- DISCORD RICH PRESENCE MODE ---
      // Check if activity timestamps are unchanged (i.e., not advancing = likely paused)
      const prevTimestamps = prevTimestampsRef.current;
      const currentTimestamps = {
        start: currentSong.timestamps.start,
        end: currentSong.timestamps.end
      };

      // Tarck Discord paused state if not changed for 2+ poll cycles (>= 200ms, to avoid flicker)
      const timestampsUnchanged =
        prevTimestamps &&
        prevTimestamps.start === currentTimestamps.start &&
        prevTimestamps.end === currentTimestamps.end;

      // We'll use this as "paused" indication
      let isPlaying = true;
      let currentTime = Math.max(0, Math.min(now - startTime, duration));

      // If song previously ended, always keep state at the end
      if (songHasEnded || currentTime >= duration) {
        setSongHasEnded(true);
        setCachedProgress(duration);
        setCachedIsPlaying(false);
        onProgressUpdate(duration, false);
        console.log('MusicProgressTracker: Song ended');
      } else if (timestampsUnchanged && prevIsPlayingRef.current) {
        // If timestamp unchanged over 2+ intervals, treat as paused
        isPlaying = false;
        currentTime = cachedProgress; // Do not advance
        setCachedIsPlaying(false);
        onProgressUpdate(currentTime, false);
        console.log('MusicProgressTracker: Detected Discord pause (stalled timestamps)');
      } else {
        // Normal Discord progress (timestamps are advancing)
        isPlaying = true;
        prevIsPlayingRef.current = true;
        setCachedProgress(currentTime);
        setLastUpdateTime(now);
        setCachedIsPlaying(true);
        onProgressUpdate(currentTime, true);
        console.log('MusicProgressTracker: Discord activity progressing', { currentTime, duration });
      }

      // Always update the reference for next loop
      prevTimestampsRef.current = currentTimestamps;
    };

    updateProgress();
    const interval = setInterval(updateProgress, 100);

    return () => {
      clearInterval(interval);
    };
  }, [currentSong, isSpotifyConnected, spotifyData, onProgressUpdate, lastUpdateTime, cachedProgress, lastSongId, songHasEnded]);
};
