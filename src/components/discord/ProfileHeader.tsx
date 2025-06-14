
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Connection {
  type: string;
  name: string;
  id: string;
  verified: boolean;
}

interface ProfileHeaderProps {
  displayName: string;
  discriminator: string;
  avatarUrl: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  bannerUrl?: string | null;
  bio?: string | null;
  customStatus?: {
    text?: string;
    emoji?: {
      name?: string;
      id?: string;
    };
  };
  connections?: Connection[];
}

export const ProfileHeader = ({ displayName, discriminator, avatarUrl, status, bannerUrl, bio, customStatus, connections = [] }: ProfileHeaderProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionLogo = (type: string) => {
    const logos = {
      spotify: '🎵',
      github: '🐙',
      youtube: '🎥',
      twitter: '🐦',
      twitch: '💜',
      steam: '🎮',
      xbox: '🎮',
      battlenet: '⚔️',
      reddit: '🤖',
      facebook: '📘',
      instagram: '📷',
      tiktok: '🎵',
      epicgames: '🎮',
      riotgames: '⚔️',
      playstation: '🎮'
    };
    return logos[type.toLowerCase()] || '🔗';
  };

  const getConnectionColor = (type: string) => {
    const colors = {
      spotify: 'bg-green-600',
      github: 'bg-gray-800',
      youtube: 'bg-red-600',
      twitter: 'bg-blue-500',
      twitch: 'bg-purple-600',
      steam: 'bg-blue-900',
      xbox: 'bg-green-700',
      battlenet: 'bg-blue-800',
      reddit: 'bg-orange-600',
      facebook: 'bg-blue-600',
      instagram: 'bg-pink-600',
      tiktok: 'bg-black',
      epicgames: 'bg-gray-900',
      riotgames: 'bg-red-700',
      playstation: 'bg-blue-700'
    };
    return colors[type.toLowerCase()] || 'bg-gray-700';
  };

  return (
    <div className="relative mb-6 h-full">
      {/* Banner Background - Ends halfway through avatar like Discord */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 h-32 rounded-lg bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      
      {/* Lighter gradient overlay for better text readability */}
      <div className="absolute inset-0 h-32 rounded-lg bg-gradient-to-b from-transparent to-gray-900/30" />
      
      {/* Profile Content */}
      <div className="relative flex flex-col pt-16">
        {/* Avatar and Username Row - Avatar overlaps banner */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative -mt-8">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                className="w-24 h-24 rounded-full ring-4 ring-gray-900 transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full ring-4 ring-gray-900 bg-gray-600 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 ${getStatusColor()} rounded-full border-3 border-gray-900`}></div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {displayName}
            </h2>
          </div>
        </div>
        
        {/* Status Dot and Custom Status Row - Aligned to Left */}
        <div className="flex items-center gap-3 mb-4">
          {/* Just the status dot */}
          <div className={`w-3 h-3 ${getStatusColor()} rounded-full`}></div>
          
          {/* Custom Status next to dot */}
          {customStatus?.text && (
            <div className="inline-flex items-center gap-2 bg-gray-800 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-600 shadow-md">
              {customStatus.emoji?.name && (
                <span className="text-sm">
                  {customStatus.emoji.id ? 
                    <img 
                      src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.png`} 
                      alt={customStatus.emoji.name} 
                      className="w-4 h-4 inline"
                    /> : 
                    customStatus.emoji.name
                  }
                </span>
              )}
              <span className="text-sm text-gray-200 font-medium">{customStatus.text}</span>
            </div>
          )}
        </div>
        
        {/* Connections Section */}
        {connections.length > 0 && (
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">CONNECTIONS</h3>
            <div className="space-y-2">
              {connections.map((connection, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                  <div className={`w-8 h-8 ${getConnectionColor(connection.type)} rounded-lg flex items-center justify-center text-white`}>
                    <span className="text-sm">
                      {getConnectionLogo(connection.type)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">{connection.type}</span>
                      <span className="text-xs text-gray-400">@{connection.name}</span>
                      {connection.verified && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
