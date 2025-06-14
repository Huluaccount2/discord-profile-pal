
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
        
        {/* Status and Bio Section - Aligned to Left */}
        <div className="space-y-4">
          <div className="flex justify-start">
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
              <div className={`w-2 h-2 ${getStatusColor()} rounded-full mr-2`}></div>
              {getStatusText()}
            </Badge>
          </div>
          
          {/* Custom Status - Left aligned */}
          {customStatus?.text && (
            <div className="flex justify-start">
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
            </div>
          )}
          
          {/* Bio - Left aligned */}
          {bio && (
            <div className="text-left max-w-md">
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
