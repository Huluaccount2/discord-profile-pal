
interface StatusIndicatorProps {
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`w-2 h-2 ${getStatusColor()} rounded-full mt-1 flex-shrink-0`}></div>
  );
};
