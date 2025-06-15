
import { User } from "lucide-react";
import { ConnectionsList } from "./ConnectionsList";
import { CustomStatus } from "./CustomStatus";
import { StatusIndicator } from "./StatusIndicator";
import React from "react";

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

export const ProfileHeader = React.memo(({ 
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
      {/* Compact banner for Car Thing */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 h-20 rounded-lg bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      
      {/* Lighter gradient overlay */}
      <div className="absolute inset-0 h-20 rounded-lg bg-gradient-to-b from-transparent to-gray-900/30" />
      
      {/* Compact Profile Content for Car Thing */}
      <div className="relative flex flex-col pt-8 flex-1 min-h-0">
        {/* Compact Avatar and Username Row */}
        <div className="flex items-start gap-3 mb-3 flex-shrink-0">
          <div className="relative -mt-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                className="w-16 h-16 rounded-full ring-2 ring-gray-900 transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 rounded-full ring-2 ring-gray-900 bg-gray-600 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor()} rounded-full border-2 border-gray-900 transition-colors duration-150`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {displayName}
            </h2>
          </div>
        </div>
        
        {/* Fixed height status container to prevent shifting */}
        <div className="flex items-start gap-2 mb-6 flex-shrink-0 h-[2.5rem]">
          <StatusIndicator status={status} />
          <CustomStatus customStatus={customStatus} />
        </div>
        
        {/* Connections Section - now takes up remaining space */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ConnectionsList connections={connections} />
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
