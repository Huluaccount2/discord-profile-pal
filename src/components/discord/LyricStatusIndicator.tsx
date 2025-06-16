
import React from 'react';
import { Music } from 'lucide-react';

interface LyricStatusIndicatorProps {
  isActive: boolean;
}

export const LyricStatusIndicator = React.memo(({ isActive }: LyricStatusIndicatorProps) => {
  if (!isActive) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-purple-900/50 backdrop-blur-sm rounded-md px-2 py-1 border border-purple-500/30">
      <Music className="w-3 h-3 text-purple-400 animate-pulse" />
      <span className="text-xs text-purple-300 font-medium">
        Lyric Status Active
      </span>
    </div>
  );
});

LyricStatusIndicator.displayName = 'LyricStatusIndicator';
