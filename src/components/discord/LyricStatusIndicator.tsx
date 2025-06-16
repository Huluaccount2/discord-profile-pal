
import React from 'react';
import { Music, FileText } from 'lucide-react';

interface LyricStatusIndicatorProps {
  isActive: boolean;
  isMonitoring?: boolean;
}

export const LyricStatusIndicator = React.memo(({ isActive, isMonitoring }: LyricStatusIndicatorProps) => {
  if (!isActive && !isMonitoring) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-purple-900/50 backdrop-blur-sm rounded-md px-2 py-1 border border-purple-500/30">
      {isActive ? (
        <>
          <Music className="w-3 h-3 text-purple-400 animate-pulse" />
          <span className="text-xs text-purple-300 font-medium">
            Lyric Status Active
          </span>
        </>
      ) : (
        <>
          <FileText className="w-3 h-3 text-purple-400/60" />
          <span className="text-xs text-purple-300/60 font-medium">
            Monitoring Lyrics
          </span>
        </>
      )}
    </div>
  );
});

LyricStatusIndicator.displayName = 'LyricStatusIndicator';
