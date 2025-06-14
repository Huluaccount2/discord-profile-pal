
import { Music } from "lucide-react";

interface EmptyMusicStateProps {
  isConnected?: boolean;
  onConnect?: () => void;
}

export const EmptyMusicState = ({ isConnected = false, onConnect }: EmptyMusicStateProps) => {
  return (
    <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
      <div className="text-center text-gray-400">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nothing is currently playing</p>
      </div>
    </div>
  );
};
