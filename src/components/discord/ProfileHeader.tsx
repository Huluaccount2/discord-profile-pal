
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  displayName: string;
  discriminator: string;
  avatarUrl: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  bannerUrl?: string | null;
}

export const ProfileHeader = ({ displayName, discriminator, avatarUrl, status, bannerUrl }: ProfileHeaderProps) => {
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

  return (
    <div className="relative mb-6">
      {/* Banner Background */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 h-24 rounded-lg bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 h-24 rounded-lg bg-gradient-to-b from-transparent to-gray-900/50" />
      
      {/* Profile Content */}
      <div className="relative flex items-center gap-4 pt-8">
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
          <h2 className="text-xl font-bold text-white mb-1">
            {displayName}
            <span className="text-gray-400 text-sm font-normal">#{discriminator}</span>
          </h2>
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
            <div className={`w-2 h-2 ${getStatusColor()} rounded-full mr-2`}></div>
            {getStatusText()}
          </Badge>
        </div>
      </div>
    </div>
  );
};
