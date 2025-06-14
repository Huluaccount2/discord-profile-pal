
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyMusicStateProps {
  isConnected?: boolean;
  onConnect?: () => void;
}

export const EmptyMusicState = ({ isConnected = false, onConnect }: EmptyMusicStateProps) => {
  return (
    <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
      <div className="text-center text-gray-400">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No music currently playing</p>
        {!isConnected && onConnect ? (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Connect Spotify for real-time music tracking</p>
            <Button 
              onClick={onConnect}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Connect Spotify
            </Button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-1">Connect Spotify to Discord to see what you're listening to</p>
        )}
      </div>
    </div>
  );
};
