import { useState, useEffect, useRef } from 'react';

interface MusicProgressTrackerProps {
  currentSong: any;
  isSpotifyConnected: boolean;
  spotifyData: any;
  onProgressUpdate: (currentTime: number, isPlaying: boolean) => void;
}

/**
 * Ensures music progress FREEZES at the exact prior play position when paused.
 * This emits the cached progress point every 500ms when paused to prevent drift and visual wiggle.
 */
export const useMusicProgressTracker = ({
  currentSong,
  isSpotifyConnected,
  spotifyData,
  onProgressUpdate
}: MusicProgressTrackerProps) => {
  const [lastSongId, setLastSongId] = useState<string | null>(null);

  // Progress state refs to persist across renders/intervals
  const cachedProgressRef = useRef(0);
  const cachedIsPlayingRef = useRef(false);
  const cachedSongHasEndedRef = useRef(false);

  // Last interval's "true" (playing) progress for each platform
  const lastEmittedProgressRef = useRef(0);

  useEffect(() => {
    if (!currentSong?.timestamps?.start || !currentSong?.timestamps?.end) {
      onProgressUpdate(0, false);
      return;
    }

    const startTime = currentSong.timestamps.start;
    const endTime = currentSong.timestamps.end;
    const duration = endTime - startTime;
    const songId = `${currentSong.details}-${currentSong.state}-${startTime}`;

    // When the song changes, reset all cached state
    if (lastSongId !== songId) {
      cachedProgressRef.current = 0;
      cachedIsPlayingRef.current = true;
      cachedSongHasEndedRef.current = false;
      lastEmittedProgressRef.current = 0;
      setLastSongId(songId);
    }

    const updateProgress = () => {
      const now = Date.now();
      let isPlaying = true;
      let progressValue = 0;

      // --------- Spotify (OAuth) branch ---------
      if (isSpotifyConnected && currentSong.name === "Spotify" && spotifyData?.track) {
        isPlaying = Boolean(spotifyData.isPlaying);
        progressValue = spotifyData.track.progress;

        if (isPlaying) {
          // If playing: always update cachedProgress to *latest* progressValue and emit
          cachedProgressRef.current = progressValue;
          cachedIsPlayingRef.current = true;
          onProgressUpdate(progressValue, true);
          lastEmittedProgressRef.current = progressValue;
        } else {
          // If paused: emit the FROZEN cachedProgress every interval (never let progress drift!)
          onProgressUpdate(cachedProgressRef.current, false);
          cachedIsPlayingRef.current = false;
        }
        return;
      }

      // --------- Discord fallback branch ---------
      const elapsed = now - startTime;
      const discordSongEnded = elapsed >= duration;

      // If the song is over, mark as ended and freeze progress at the end
      if (discordSongEnded && !cachedSongHasEndedRef.current) {
        cachedProgressRef.current = duration;
        cachedIsPlayingRef.current = false;
        cachedSongHasEndedRef.current = true;
        onProgressUpdate(duration, false);
        lastEmittedProgressRef.current = duration;
      } else if (discordSongEnded && cachedSongHasEndedRef.current) {
        // Just keep re-emitting the end state if they keep us running after end
        onProgressUpdate(duration, false);
      } else {
        // Is song playing (detect stall by seeing if progress value is not advancing)?
        // To freeze instantly on pause, we use a "last emitted" comparison.
        const computedProgress = Math.max(0, Math.min(elapsed, duration));

        if (cachedIsPlayingRef.current && computedProgress !== lastEmittedProgressRef.current) {
          // If progress advanced, treat as playing, update cache and emit
          isPlaying = true;
          progressValue = computedProgress;
          cachedProgressRef.current = progressValue;
          cachedIsPlayingRef.current = true;
          onProgressUpdate(progressValue, true);
          lastEmittedProgressRef.current = progressValue;
        } else if (!cachedIsPlayingRef.current || computedProgress === lastEmittedProgressRef.current) {
          // Progress stuck (paused): emit the frozen progress from before the stall every interval
          isPlaying = false;
          onProgressUpdate(cachedProgressRef.current, false);
          cachedIsPlayingRef.current = false;
          // NB: update lastEmittedProgressRef here so that a "stuck" progress value doesn't allow drift
        }
      }
    };

    updateProgress();
    // Keep the progress bar synced every 500ms, especially when paused.
    const interval = setInterval(updateProgress, 500);

    return () => clearInterval(interval);
  }, [
    currentSong,
    isSpotifyConnected,
    spotifyData,
    onProgressUpdate,
    lastSongId,
  ]);
};
