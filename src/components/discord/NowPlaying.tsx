import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { MusicArtwork } from './music/MusicArtwork';
import { MusicInfo } from './music/MusicInfo';
import { MusicProgressBar } from './music/MusicProgressBar';

interface NowPlayingProps {
  currentSong: any;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isSpotifyConnected?: boolean;
  spotifyData?: any;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentSong,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  isSpotifyConnected = false,
  spotifyData
}) => {
  // Unique key for song (details+state, fallback to timestamps if needed)
  const songKey =
    currentSong?.id ||
    (currentSong?.details && currentSong?.state
      ? `${currentSong.details} - ${currentSong.state}`
      : currentSong?.timestamps?.start?.toString() || 'unknown');

  // Progress tracking state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frozenProgress, setFrozenProgress] = useState<number | null>(null);
  const lastSongKeyRef = useRef<string>(songKey);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // On song change, reset all states
  useEffect(() => {
    if (!currentSong) return;

    if (lastSongKeyRef.current !== songKey) {
      // New song detected: reset progress
      const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
      let initialProgress = 0;
      if (isSpotifyConnected && spotifyData?.track?.progress != null) {
        initialProgress = spotifyData.track.progress;
      } else if (currentSong.timestamps?.start) {
        initialProgress = Math.max(0, Date.now() - currentSong.timestamps.start);
      }
      setCurrentTime(Math.min(initialProgress, duration));
      setFrozenProgress(null);
      setIsPlaying(isSpotifyConnected && spotifyData?.isPlaying);
      lastSongKeyRef.current = songKey;
    }
    // eslint-disable-next-line
  }, [currentSong, songKey, isSpotifyConnected, spotifyData?.track?.progress, spotifyData?.isPlaying]);

  // On pause, freeze progress at current spot
  useEffect(() => {
    if (!isPlaying && currentSong) {
      setFrozenProgress(currentTime);
    }
    if (isPlaying) {
      setFrozenProgress(null);
    }
  }, [isPlaying, currentSong, currentTime]);

  // Timer to update progress bar every second (only when playing, and only for THIS song)
  useEffect(() => {
    if (isPlaying && currentSong && lastSongKeyRef.current === songKey) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const duration = currentSong.timestamps.end - currentSong.timestamps.start;
          return Math.min(prev + 1000, duration);
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentSong, songKey]);

  if (!currentSong) return null;

  const validTimestamps =
    currentSong.timestamps &&
    typeof currentSong.timestamps.start === 'number' &&
    typeof currentSong.timestamps.end === 'number' &&
    currentSong.timestamps.end > currentSong.timestamps.start;

  const duration = validTimestamps
    ? currentSong.timestamps.end - currentSong.timestamps.start
    : 0;

  // Use frozen progress only for this song, when paused
  const shownTime =
    !isPlaying && frozenProgress !== null && lastSongKeyRef.current === songKey
      ? frozenProgress
      : currentTime;

  // ======== DEBUG LOG HERE =========
  console.log(
    '[NowPlaying] Song:', currentSong.details, '|',
    'Artist:', currentSong.state, '|',
    'Start:', currentSong.timestamps?.start, '|',
    'End:', currentSong.timestamps?.end, '|',
    'Duration:', duration, '|',
    'Now:', Date.now(),
    '| isPlaying:', isPlaying, '| shownTime:', shownTime
  );
  // ======== END DEBUG LOG ==========

  const progress = duration > 0 ? (shownTime / duration) * 100 : 0;

  const actuallyPlaying =
    isSpotifyConnected && spotifyData?.isPlaying !== undefined
      ? spotifyData.isPlaying
      : isPlaying;

  const showControls = isSpotifyConnected && onPlay && onPause && onNext && onPrevious;

  const handlePlayPause = () => {
    if (actuallyPlaying) {
      onPause?.();
      setIsPlaying(false);
    } else {
      onPlay?.();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{
          backgroundImage: `url(${currentSong.assets?.large_image || '/placeholder.svg'})`,
          filter: 'blur(20px) brightness(0.6)'
        }}
      />
      <Card className="relative bg-black/30 backdrop-blur-sm border-gray-700/50 p-6 w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center space-x-8 w-full min-w-0 flex-1">
          <div className="flex-shrink-0">
            <MusicArtwork
              imageUrl={currentSong.assets?.large_image}
              altText={currentSong.assets?.large_text}
              isPlaying={actuallyPlaying}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <MusicInfo
              title={currentSong.details}
              artist={currentSong.state}
              album={currentSong.assets?.large_text}
              isPlaying={actuallyPlaying}
            />
          </div>
        </div>
        <div className="w-full mt-4">
          <MusicProgressBar
            currentTime={shownTime}
            duration={duration}
            progress={progress}
            isPlaying={actuallyPlaying}
          />
        </div>
        {showControls && (
          <div className="flex items-center justify-center space-x-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPrevious?.()}
              className="text-white hover:bg-white/20"
              disabled={!isSpotifyConnected}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
              disabled={!isSpotifyConnected}
            >
              {actuallyPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNext?.()}
              className="text-white hover:bg-white/20"
              disabled={!isSpotifyConnected}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
