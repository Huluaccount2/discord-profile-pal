
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Headphones } from "lucide-react";
import { useState, useEffect } from "react";

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock Discord user data
  const discordUser = {
    username: "CodeMaster",
    discriminator: "1337",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    status: "online", // online, idle, dnd, offline
    customStatus: "Building cool stuff 🚀",
    activity: {
      type: "listening",
      name: "Spotify",
      details: "The Midnight",
      state: "Vampires",
      timestamps: {
        start: Date.now() - 120000, // Started 2 minutes ago
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "idle": return "bg-yellow-500";
      case "dnd": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "idle": return "Away";
      case "dnd": return "Do Not Disturb";
      default: return "Offline";
    }
  };

  const formatDuration = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-300">DesktThing</span>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={discordUser.avatar}
            alt={`${discordUser.username}'s avatar`}
            className="w-16 h-16 rounded-full ring-2 ring-gray-700 transition-transform hover:scale-105"
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(discordUser.status)} rounded-full border-2 border-gray-900`}></div>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">
            {discordUser.username}
            <span className="text-gray-400 text-sm font-normal">#{discordUser.discriminator}</span>
          </h2>
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
            <div className={`w-2 h-2 ${getStatusColor(discordUser.status)} rounded-full mr-2`}></div>
            {getStatusText(discordUser.status)}
          </Badge>
        </div>
      </div>

      {/* Custom Status */}
      {discordUser.customStatus && (
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
          <p className="text-sm text-gray-300">{discordUser.customStatus}</p>
        </div>
      )}

      {/* Now Playing */}
      {discordUser.activity && (
        <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Listening to {discordUser.activity.name}</span>
            </div>
            <div className="flex-1"></div>
            <Headphones className="w-4 h-4 text-green-400 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <p className="text-white font-medium">{discordUser.activity.details}</p>
            <p className="text-gray-400 text-sm">by {discordUser.activity.state}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400 font-mono">
                {formatDuration(discordUser.activity.timestamps.start)} elapsed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700/30 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>Discord Profile Widget</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
          <span>Live</span>
        </div>
      </div>
    </Card>
  );
};
