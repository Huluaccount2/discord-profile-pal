
import React from 'react';
import { Music, Clock } from 'lucide-react';
import { CurrentLyric } from '@/services/LyricStatusMonitor';

interface LyricDisplayProps {
  currentLyric: CurrentLyric;
}

export const LyricDisplay = React.memo(({ currentLyric }: LyricDisplayProps) => {
  return (
    <div className="inline-flex items-start gap-2 bg-purple-900/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/30 shadow-md flex-1 min-w-0 min-h-[2.5rem]">
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <Music className="w-3 h-3 text-purple-400 animate-pulse" />
        <span className="text-xs text-purple-300 font-medium">♪</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs text-purple-200 font-medium break-words leading-relaxed">
          {currentLyric.text || 'No lyrics available'}
        </div>
        
        {currentLyric.songInfo && (
          <div className="text-xs text-purple-400/70 mt-1 truncate">
            {currentLyric.songInfo.artist} - {currentLyric.songInfo.title}
          </div>
        )}
        
        {currentLyric.nextText && (
          <div className="text-xs text-purple-300/50 mt-1 truncate">
            Next: {currentLyric.nextText}
          </div>
        )}
      </div>
      
      {currentLyric.progress > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <Clock className="w-3 h-3 text-purple-400/60" />
          <span className="text-xs text-purple-300/60">
            {Math.round(currentLyric.progress)}%
          </span>
        </div>
      )}
    </div>
  );
});

LyricDisplay.displayName = 'LyricDisplay';
