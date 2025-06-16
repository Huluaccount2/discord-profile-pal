
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
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ensure progress is within bounds and handle edge cases
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="mb-2">
      <Progress 
        value={clampedProgress} 
        className="h-3 mb-3"
      />
      <div className="flex justify-between text-base text-gray-300">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
