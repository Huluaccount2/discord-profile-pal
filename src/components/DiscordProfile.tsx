
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetHeader } from "@/components/discord/WidgetHeader";
import { ProfileHeader } from "@/components/discord/ProfileHeader";
import { NowPlaying } from "@/components/discord/NowPlaying";
import { EmptyMusicState } from "@/components/discord/EmptyMusicState";
import { WidgetFooter } from "@/components/discord/WidgetFooter";
import { useProfile } from "@/hooks/useProfile";
import { useDiscordData } from "@/hooks/useDiscordData";
import { useSpotify } from "@/hooks/useSpotify";

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { discordData, refreshing, fetchDiscordData } = useDiscordData(user?.id, profile?.discord_id);
  const { spotifyData, isConnected, connectSpotify } = useSpotify(user?.id);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Get banner URL from Discord data
  const bannerUrl = discordData?.user?.banner ? 
    `https://cdn.discordapp.com/banners/${discordData.user.id}/${discordData.user.banner}.png?size=600` : 
    null;

  // Get bio and custom status from Discord data
  const bio = discordData?.user?.bio || null;
  const customStatus = discordData?.custom_status || null;

  // Check for current song - prioritize Spotify integration, fall back to Discord activities
  const discordSong = discordData?.activities?.find(activity => activity.type === 2);
  
  // Convert Spotify data to Discord activity format if available
  let currentSong = null;
  if (spotifyData?.isPlaying && spotifyData.track) {
    const track = spotifyData.track;
    const startTime = Date.now() - track.progress;
    
    currentSong = {
      name: "Spotify",
      type: 2,
      details: track.name,
      state: `by ${track.artist}`,
      timestamps: {
        start: Math.floor(startTime),
        end: Math.floor(startTime + track.duration),
      },
      assets: {
        large_image: track.albumCover,
        large_text: track.album,
      },
    };
  } else if (discordSong) {
    currentSong = discordSong;
  }

  return (
    <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl">
      <WidgetHeader 
        currentTime={currentTime}
        refreshing={refreshing}
        onRefresh={() => fetchDiscordData()}
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
        <EmptyMusicState 
          isConnected={isConnected}
          onConnect={connectSpotify}
        />
      )}

      <WidgetFooter />
    </Card>
  );
};
