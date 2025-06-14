
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetHeaderProps {
  currentTime: Date;
  refreshing: boolean;
  onRefresh: () => void;
  hideRefreshButton?: boolean;
}

export const WidgetHeader = ({ currentTime, refreshing, onRefresh, hideRefreshButton = false }: WidgetHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-300">Now Playing</span>
      </div>
      <div className="flex items-center gap-2">
        {!hideRefreshButton && (
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white p-2 h-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <div className="text-xs text-gray-500 font-mono">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
