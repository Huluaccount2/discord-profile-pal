
import { Music } from "lucide-react";

export const EmptyMusicState = () => {
  return (
    <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
      <div className="text-center text-gray-400">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No music currently playing</p>
        <p className="text-xs text-gray-500 mt-1">Connect Spotify to Discord to see what you're listening to</p>
      </div>
    </div>
  );
};
