
import React from 'react';
import { useDebounceState } from '@/hooks/useDebounceState';

interface StatusIndicatorProps {
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export const StatusIndicator = React.memo(({ status }: StatusIndicatorProps) => {
  // Debounce status changes to prevent rapid color flickering
  const debouncedStatus = useDebounceState(status, 100);

  const getStatusColor = () => {
    switch (debouncedStatus) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`w-2 h-2 ${getStatusColor()} rounded-full mt-1 flex-shrink-0 transition-colors duration-150`}></div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';
