

import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, DiscordData } from "@/types/discord";
import { WidgetHeader } from "@/components/discord/WidgetHeader";
import { ProfileHeader } from "@/components/discord/ProfileHeader";
import { NowPlaying } from "@/components/discord/NowPlaying";
import { EmptyMusicState } from "@/components/discord/EmptyMusicState";
import { WidgetFooter } from "@/components/discord/WidgetFooter";

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

  const fetchDiscordData = async (showToast = true) => {
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
        if (showToast) {
          toast({
            title: "Error fetching Discord data",
            description: "Failed to connect to Discord. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Discord data received:', data);
        setDiscordData(data);
        if (showToast) {
          toast({
            title: "Discord data updated",
            description: "Successfully fetched your Discord activity!",
          });
        }
      }
    } catch (error) {
      console.error('Error calling Discord function:', error);
      if (showToast) {
        toast({
          title: "Connection error",
          description: "Failed to fetch Discord data. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && profile?.discord_id) {
      fetchDiscordData();
    }
  }, [user, profile?.discord_id]);

  // Auto-refresh Discord data every 50 milliseconds
  useEffect(() => {
    if (!user || !profile?.discord_id) return;

    const autoRefreshInterval = setInterval(() => {
      fetchDiscordData(false); // Don't show toast for auto-refresh
    }, 50); // 50 milliseconds

    return () => clearInterval(autoRefreshInterval);
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

  // Get banner URL from Discord data
  const bannerUrl = discordData?.user?.banner ? 
    `https://cdn.discordapp.com/banners/${discordData.user.id}/${discordData.user.banner}.png?size=600` : 
    null;

  // Get bio and custom status from Discord data
  const bio = discordData?.user?.bio || null;
  const customStatus = discordData?.custom_status || null;

  // Only show listening activities (type 2)
  const currentSong = activities.find(activity => activity.type === 2);

  return (
    <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
      <WidgetHeader 
        currentTime={currentTime}
        refreshing={refreshing}
        onRefresh={() => fetchDiscordData(true)}
        hideRefreshButton={true}
      />

      <ProfileHeader 
        displayName={displayName}
        discriminator={discriminator}
        avatarUrl={avatarUrl}
        status={status}
        bannerUrl={bannerUrl}
        bio={bio}
        customStatus={customStatus}
      />

      {currentSong ? (
        <NowPlaying currentSong={currentSong} />
      ) : (
        <EmptyMusicState />
      )}

      <WidgetFooter />
    </Card>
  );
};

