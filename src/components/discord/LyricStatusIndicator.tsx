
import React from 'react';
import { Music, FileText, AlertCircle } from 'lucide-react';

interface LyricStatusIndicatorProps {
  isActive: boolean;
  isMonitoring?: boolean;
  error?: string | null;
}

export const LyricStatusIndicator = React.memo(({ isActive, isMonitoring, error }: LyricStatusIndicatorProps) => {
  if (!isActive && !isMonitoring && !error) return null;

  // Error state
  if (error) {
    return (
      <div className="inline-flex items-center gap-1 bg-red-900/50 backdrop-blur-sm rounded-md px-2 py-1 border border-red-500/30">
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-xs text-red-300 font-medium">
          Lyric Status Error
        </span>
      </div>
    );
  }

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
            Monitoring Files
          </span>
        </>
      )}
    </div>
  );
});

LyricStatusIndicator.displayName = 'LyricStatusIndicator';
