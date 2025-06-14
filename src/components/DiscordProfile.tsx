
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Headphones, User, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  discord_id: string | null;
  discord_username: string | null;
  discord_discriminator: string | null;
  discord_avatar: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface DiscordActivity {
  name: string;
  type: number;
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
}

interface DiscordData {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: DiscordActivity[];
  avatar_url: string | null;
}

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const fetchDiscordData = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      console.log('Fetching Discord data...');
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Discord function error:', error);
        toast({
          title: "Error fetching Discord data",
          description: "Failed to connect to Discord. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Discord data received:', data);
        setDiscordData(data);
        toast({
          title: "Discord data updated",
          description: "Successfully fetched your Discord activity!",
        });
      }
    } catch (error) {
      console.error('Error calling Discord function:', error);
      toast({
        title: "Connection error",
        description: "Failed to fetch Discord data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && profile?.discord_id) {
      fetchDiscordData();
    }
  }, [user, profile?.discord_id]);

  if (loading) {
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
        <div className="text-center text-white">Loading profile...</div>
      </Card>
    );
  }

  // Use Discord data if available, otherwise fall back to regular profile data
  const displayName = discordData?.user?.username || profile?.discord_username || profile?.username || "User";
  const discriminator = discordData?.user?.discriminator || profile?.discord_discriminator || "0000";
  const avatarUrl = discordData?.avatar_url || profile?.discord_avatar || profile?.avatar_url || null;
  const status = discordData?.status || 'offline';
  const activities = discordData?.activities || [];

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

  const formatDuration = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentActivity = activities.find(activity => activity.type === 2) || activities[0]; // Prioritize listening activities

  return (
    <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-300">DesktThing</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchDiscordData}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white p-2 h-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <div className="text-xs text-gray-500 font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
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

      {/* Discord Connection Status */}
      {profile?.discord_username ? (
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
          <p className="text-sm text-green-400">✅ Connected to Discord</p>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-yellow-700/30">
          <p className="text-sm text-yellow-400">⚠️ Discord not connected - Click refresh to connect</p>
        </div>
      )}

      {/* Current Activity */}
      {currentActivity ? (
        <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                {currentActivity.type === 2 ? 'Listening to' : 'Playing'} {currentActivity.name}
              </span>
            </div>
            <div className="flex-1"></div>
            <Headphones className="w-4 h-4 text-green-400 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            {currentActivity.details && (
              <p className="text-white font-medium">{currentActivity.details}</p>
            )}
            {currentActivity.state && (
              <p className="text-gray-400 text-sm">by {currentActivity.state}</p>
            )}
            {currentActivity.timestamps?.start && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400 font-mono">
                  {formatDuration(currentActivity.timestamps.start)} elapsed
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4">
          <div className="text-center text-gray-400">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No current activity detected</p>
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
