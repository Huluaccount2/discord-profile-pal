
import { User } from "lucide-react";
import { ConnectionsList } from "./ConnectionsList";

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

export const ProfileHeader = ({ 
  displayName, 
  discriminator, 
  avatarUrl, 
  status, 
  bannerUrl, 
  customStatus, 
  connections = [] 
}: ProfileHeaderProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      {/* Larger banner for Car Thing */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 h-24 rounded-lg bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      
      {/* Lighter gradient overlay */}
      <div className="absolute inset-0 h-24 rounded-lg bg-gradient-to-b from-transparent to-gray-900/30" />
      
      {/* Profile Content with larger avatar */}
      <div className="relative flex flex-col pt-10 flex-1 min-h-0">
        {/* Larger Avatar and Username Row */}
        <div className="flex items-start gap-3 mb-3 flex-shrink-0">
          <div className="relative -mt-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                className="w-20 h-20 rounded-full ring-2 ring-gray-900 transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-20 h-20 rounded-full ring-2 ring-gray-900 bg-gray-600 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor()} rounded-full border-2 border-gray-900`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {displayName}
            </h2>
          </div>
        </div>
        
        {/* Compact Status Row with proper spacing */}
        <div className="flex items-start gap-2 mb-6 flex-shrink-0">
          <div className={`w-2 h-2 ${getStatusColor()} rounded-full mt-1 flex-shrink-0`}></div>
          
          {/* Custom Status with proper text wrapping */}
          {customStatus?.text && (
            <div className="inline-flex items-start gap-1 bg-gray-800 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-600 shadow-md flex-1 min-w-0">
              {customStatus.emoji?.name && (
                <span className="text-xs flex-shrink-0 mt-0.5">
                  {customStatus.emoji.id ? 
                    <img 
                      src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.png`} 
                      alt={customStatus.emoji.name} 
                      className="w-3 h-3 inline"
                    /> : 
                    customStatus.emoji.name
                  }
                </span>
              )}
              <span className="text-xs text-gray-200 font-medium break-words leading-relaxed">
                {customStatus.text}
              </span>
            </div>
          )}
        </div>
        
        {/* Connections Section - now takes up remaining space */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ConnectionsList connections={connections} />
        </div>
      </div>
    </div>
  );
};
