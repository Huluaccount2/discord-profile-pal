
import { Music } from "lucide-react";

export const WidgetFooter = () => {
  return (
    <div className="mt-6 pt-4 border-t border-gray-700/30 flex items-center justify-between text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <Music className="w-3 h-3" />
        <span>Music Widget</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
        <span>Live</span>
      </div>
    </div>
  );
};
