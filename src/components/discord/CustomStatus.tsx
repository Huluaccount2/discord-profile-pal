
import React from 'react';
import { useDebounceState } from '@/hooks/useDebounceState';

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
  // Debounce the status text to prevent flickering during rapid changes
  const debouncedStatusText = useDebounceState(customStatus?.text, 150);

  // Always render a container to maintain consistent layout
  if (!debouncedStatusText) {
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
        {debouncedStatusText}
      </span>
    </div>
  );
});

CustomStatus.displayName = 'CustomStatus';
