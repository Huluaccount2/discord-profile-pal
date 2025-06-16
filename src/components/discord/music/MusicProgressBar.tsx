
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface MusicProgressBarProps {
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

export const MusicProgressBar: React.FC<MusicProgressBarProps> = ({
  currentTime,
  duration,
  progress,
  isPlaying
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-2">
      <Progress 
        value={progress} 
        className="h-2 mb-2 transition-opacity"
      />
      <div className="flex justify-between text-xs text-gray-300 transition-opacity">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
