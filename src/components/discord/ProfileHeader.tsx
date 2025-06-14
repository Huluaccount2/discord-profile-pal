
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  displayName: string;
  discriminator: string;
  avatarUrl: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export const ProfileHeader = ({ displayName, discriminator, avatarUrl, status }: ProfileHeaderProps) => {
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
    <div className="flex items-center gap-4 mb-6">
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
  );
};
