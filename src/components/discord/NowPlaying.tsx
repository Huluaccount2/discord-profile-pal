
import { Music, Headphones } from "lucide-react";
import { DiscordActivity } from "@/types/discord";

interface NowPlayingProps {
  currentSong: DiscordActivity;
}

export const NowPlaying = ({ currentSong }: NowPlayingProps) => {
  const formatDuration = (startTime: number, endTime?: number) => {
    if (endTime) {
      const total = Math.floor((endTime - startTime) / 1000);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, total - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
    } else {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')} elapsed`;
    }
  };

  console.log('NowPlaying component received currentSong:', currentSong);
  console.log('Album cover URL:', currentSong.assets?.large_image);

  return (
    <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/30 rounded-lg p-4 w-full h-full flex items-center">
      <div className="flex items-center gap-6 w-full">
        {/* Album Cover - larger for Car Thing */}
        {currentSong.assets?.large_image && (
          <div className="flex-shrink-0">
            <img
              src={currentSong.assets.large_image}
              alt={currentSong.assets.large_text || 'Album cover'}
              className="w-32 h-32 rounded-lg shadow-lg object-cover"
              onError={(e) => {
                console.error('Failed to load album cover:', currentSong.assets?.large_image);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Album cover loaded successfully:', currentSong.assets?.large_image);
              }}
            />
          </div>
        )}
        
        {/* Song Info - larger text for Car Thing */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-green-400" />
              <span className="text-base font-medium text-green-400">
                Listening to {currentSong.name}
              </span>
            </div>
            <div className="flex-1"></div>
            <Headphones className="w-5 h-5 text-green-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            {currentSong.details && (
              <p className="text-white font-semibold text-2xl truncate">{currentSong.details}</p>
            )}
            {currentSong.state && (
              <p className="text-gray-400 text-lg truncate">{currentSong.state}</p>
            )}
            {currentSong.assets?.large_text && (
              <p className="text-gray-500 text-sm truncate">on {currentSong.assets.large_text}</p>
            )}
            {currentSong.timestamps?.start && (
              <div className="flex items-center gap-3 mt-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 font-mono">
                  {formatDuration(currentSong.timestamps.start, currentSong.timestamps.end)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
