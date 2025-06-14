
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

export const ProfileHeader = ({ displayName, discriminator, avatarUrl, status, bannerUrl, bio, customStatus }: ProfileHeaderProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  const renderBioWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative mb-6">
      {/* Banner Background - Much Brighter */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 h-24 rounded-lg bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      
      {/* Lighter gradient overlay for better text readability */}
      <div className="absolute inset-0 h-24 rounded-lg bg-gradient-to-b from-transparent to-gray-900/30" />
      
      {/* Profile Content */}
      <div className="relative flex items-start gap-4 pt-8">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              className="w-16 h-16 rounded-full ring-2 ring-gray-700 transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-16 h-16 rounded-full ring-2 ring-gray-700 bg-gray-600 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor()} rounded-full border-2 border-gray-900`}></div>
        </div>
        
        <div className="flex-1">
          {/* Username next to profile picture */}
          <h2 className="text-xl font-bold text-white mb-2">
            {displayName}
          </h2>
          
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors mb-3">
            <div className={`w-2 h-2 ${getStatusColor()} rounded-full mr-2`}></div>
            {getStatusText()}
          </Badge>
          
          {/* Custom Status - Discord-style bubble with improved visibility */}
          {customStatus?.text && (
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 bg-gray-800 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-600 shadow-md">
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
            </div>
          )}
          
          {/* Bio with clickable links */}
          {bio && (
            <div className="mt-2">
              <p className="text-sm text-gray-400 whitespace-pre-line">
                {renderBioWithLinks(bio)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
