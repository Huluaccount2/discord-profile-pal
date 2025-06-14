
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Headphones, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  discord_id: string | null;
  discord_username: string | null;
  discord_discriminator: string | null;
  discord_avatar: string | null;
  username: string | null;
  avatar_url: string | null;
}

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
        <div className="text-center text-white">Loading profile...</div>
      </Card>
    );
  }

  // Use Discord data if available, otherwise fall back to regular profile data
  const displayName = profile?.discord_username || profile?.username || "User";
  const discriminator = profile?.discord_discriminator || "0000";
  const avatarUrl = profile?.discord_avatar || profile?.avatar_url || null;
  
  // Mock activity data (Discord activity requires real-time Discord API integration)
  const mockActivity = {
    type: "listening",
    name: "Spotify",
    details: "The Midnight",
    state: "Vampires",
    timestamps: {
      start: Date.now() - 120000, // Started 2 minutes ago
    }
  };

  const getStatusColor = () => "bg-green-500"; // Default to online
  const getStatusText = () => "Online";

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

      {/* Custom Status - only show if Discord data is available */}
      {profile?.discord_username && (
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
          <p className="text-sm text-gray-300">Connected via Discord 🎮</p>
        </div>
      )}

      {/* Now Playing - Mock data for demonstration */}
      <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Listening to {mockActivity.name}</span>
          </div>
          <div className="flex-1"></div>
          <Headphones className="w-4 h-4 text-green-400 animate-pulse" />
        </div>
        
        <div className="space-y-1">
          <p className="text-white font-medium">{mockActivity.details}</p>
          <p className="text-gray-400 text-sm">by {mockActivity.state}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-mono">
              {formatDuration(mockActivity.timestamps.start)} elapsed
            </span>
          </div>
        </div>
      </div>

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
