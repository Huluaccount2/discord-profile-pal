import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  // Internal progress/time for the bar, initialized to song's progress if available
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep track of last timestamps so progress continues smoothly
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When song changes, reset timer state
    if (currentSong) {
      const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
      let initialProgress = 0;
      if (isSpotifyConnected && spotifyData?.track?.progress != null) {
        initialProgress = spotifyData.track.progress;
      } else if (currentSong.timestamps?.start) {
        initialProgress = Math.max(0, Date.now() - currentSong.timestamps.start);
      }
      setCurrentTime(Math.min(initialProgress, duration));
      setIsPlaying(isSpotifyConnected && spotifyData?.isPlaying);
    }
    // eslint-disable-next-line
  }, [currentSong, isSpotifyConnected, spotifyData?.track?.progress, spotifyData?.isPlaying]);

  // Timer to update progress bar every second (only when playing)
  useEffect(() => {
    if (isPlaying && currentSong && currentSong.timestamps) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const duration = currentSong.timestamps.end - currentSong.timestamps.start;
          // Clamp to duration (song end)
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
  }, [isPlaying, currentSong]);

  if (!currentSong) return null;

  const duration = currentSong.timestamps?.end - currentSong.timestamps?.start || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Priority: Spotify API state, then fallback to local state
  const actuallyPlaying =
    isSpotifyConnected && spotifyData?.isPlaying !== undefined
      ? spotifyData.isPlaying
      : isPlaying;

  const showControls = isSpotifyConnected && onPlay && onPause && onNext && onPrevious;

  // Handler for Play/Pause button
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
            currentTime={currentTime}
            duration={duration}
            progress={progress}
            isPlaying={actuallyPlaying}
          />
       <div className="w-full mt-4">
          <MusicProgressBar
            currentTime={currentTime}
            duration={duration}
            progress={progress}
            isPlaying={actuallyPlaying}
          />
        </div>
        {/* Playback controls removed as per user request */}
      </Card>
    </div>
  );
};
