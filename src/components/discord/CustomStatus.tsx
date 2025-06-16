
import React from 'react';
import { LyricDisplay } from './LyricDisplay';
import { useLyricStatus } from '@/hooks/useLyricStatus';

interface CustomStatusProps {
  customStatus?: {
    text?: string;
    emoji?: {
      name?: string;
      id?: string;
    };
  };
}

export const CustomStatus = React.memo(({ customStatus }: CustomStatusProps) => {
  const { currentLyric, isActive } = useLyricStatus();
  
  // Priority 1: Show Lyric Status if active and has lyrics
  if (isActive && currentLyric) {
    return <LyricDisplay currentLyric={currentLyric} />;
  }
  
  // Priority 2: Show Discord custom status
  const statusText = customStatus?.text;
  
  // Always render a container to maintain consistent layout
  if (!statusText) {
    return <div className="flex-1 min-w-0 min-h-[2.5rem]"></div>;
  }

  return (
    <div className="inline-flex items-start gap-1 bg-gray-800 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-600 shadow-md flex-1 min-w-0 min-h-[2.5rem]">
      {customStatus?.emoji?.name && (
        <span className="text-xs flex-shrink-0 mt-0.5">
          {customStatus.emoji.id ? 
            <img 
              src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.png`} 
              alt={customStatus.emoji.name} 
              className="w-3 h-3 inline"
            /> : 
            customStatus.emoji.name
          }
        </span>
      )}
      <span className="text-xs text-gray-200 font-medium break-words leading-relaxed">
        {statusText}
      </span>
    </div>
  );
});

CustomStatus.displayName = 'CustomStatus';
