
import { Music, Headphones, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { DiscordActivity } from "@/types/discord";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface NowPlayingProps {
  currentSong: DiscordActivity;
}

export const NowPlaying = ({ currentSong }: NowPlayingProps) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (currentSong.timestamps?.start && currentSong.timestamps?.end) {
      const updateProgress = () => {
        const startTime = currentSong.timestamps!.start!;
        const endTime = currentSong.timestamps!.end!;
        const totalDuration = endTime - startTime;
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        setProgress(progressPercent);
      };

      updateProgress();
      const interval = setInterval(updateProgress, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSong]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? 'Pausing' : 'Playing');
    // In a real implementation, this would control the actual playback
  };

  const handlePrevious = () => {
    console.log('Previous track');
    // In a real implementation, this would skip to previous track
  };

  const handleNext = () => {
    console.log('Next track');
    // In a real implementation, this would skip to next track
  };

  console.log('NowPlaying component received currentSong:', currentSong);
  console.log('Album cover URL:', currentSong.assets?.large_image);

  return (
    <div className="relative bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/30 rounded-lg p-4 w-full h-full flex flex-col overflow-hidden">
      {/* Blurred background */}
      {currentSong.assets?.large_image && (
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-lg opacity-20 blur-sm"
          style={{ 
            backgroundImage: `url(${currentSong.assets.large_image})`,
            filter: 'blur(8px) brightness(0.4)'
          }}
        />
      )}
      
      {/* Content overlay */}
      <div className="relative z-10 flex items-center gap-6 flex-1">
        {/* Album Cover */}
        {currentSong.assets?.large_image && (
          <div className="flex-shrink-0">
            <img
              src={currentSong.assets.large_image}
              alt={currentSong.assets.large_text || 'Album cover'}
              className="w-32 h-32 rounded-lg shadow-lg object-cover"
              onError={(e) => {
                console.error('Failed to load album cover:', currentSong.assets?.large_image);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Album cover loaded successfully:', currentSong.assets?.large_image);
              }}
            />
          </div>
        )}
        
        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <Music className="w-5 h-5 text-green-400" />
            <span className="text-base font-medium text-green-400">
              {currentSong.name}
            </span>
            <Headphones className="w-5 h-5 text-green-400 animate-pulse ml-auto" />
          </div>
          
          <div className="space-y-2">
            {currentSong.details && (
              <p className="text-white font-semibold text-2xl truncate">{currentSong.details}</p>
            )}
            {currentSong.state && (
              <p className="text-gray-400 text-xl truncate">{currentSong.state}</p>
            )}
            {currentSong.assets?.large_text && (
              <p className="text-gray-500 text-lg truncate">{currentSong.assets.large_text}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar and controls */}
      <div className="relative z-10 mt-4 space-y-3">
        <Progress value={progress} className="w-full h-2" />
        
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-all duration-200 hover:scale-110"
            onClick={handlePrevious}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-all duration-200 hover:scale-110"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-all duration-200 hover:scale-110"
            onClick={handleNext}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
