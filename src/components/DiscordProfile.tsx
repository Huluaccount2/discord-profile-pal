import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileHeader } from "@/components/discord/ProfileHeader";
import { NowPlaying } from "@/components/discord/NowPlaying";
import { EmptyMusicState } from "@/components/discord/EmptyMusicState";
import { WidgetFooter } from "@/components/discord/WidgetFooter";
import { useProfile } from "@/hooks/useProfile";
import { useDiscordData } from "@/hooks/useDiscordData";
import { useSpotify } from "@/hooks/useSpotify";

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastKnownSong, setLastKnownSong] = useState(null);
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { discordData, refreshing, fetchDiscordData } = useDiscordData(user?.id, profile?.discord_id);
  const { 
    spotifyData, 
    isConnected, 
    connectSpotify
  } = useSpotify(user?.id);

  console.log('DiscordProfile: Rendering with user:', user?.id, 'profile:', profile, 'loading:', loading);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    console.log('DiscordProfile: Still loading profile...');
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl h-full">
        <div className="text-center text-white">Loading profile...</div>
      </Card>
    );
  }

  try {
    // Use Discord data if available, otherwise fall back to regular profile data
    const displayName = discordData?.user?.username || profile?.discord_username || profile?.username || "User";
    const discriminator = discordData?.user?.discriminator || profile?.discord_discriminator || "0000";
    const avatarUrl = discordData?.avatar_url || profile?.discord_avatar || profile?.avatar_url || null;
    const status = discordData?.status || 'offline';

    console.log('DiscordProfile: Display data:', { displayName, discriminator, avatarUrl, status });

    // Get banner URL from Discord data
    const bannerUrl = discordData?.user?.banner ? 
      `https://cdn.discordapp.com/banners/${discordData.user.id}/${discordData.user.banner}.png?size=600` : 
      null;

    // Get bio, custom status, and connections from Discord data
    const bio = discordData?.user?.bio || null;
    const customStatus = discordData?.custom_status || null;
    const connections = discordData?.connections || [];

    // Prioritize our Spotify OAuth integration over Discord's expired connection
    let currentSong = null;
    
    console.log('DiscordProfile: Spotify integration status:', { 
      isConnected, 
      spotifyData,
      discordActivities: discordData?.activities 
    });

    if (isConnected && spotifyData?.track) {
      // Use our own Spotify integration first (even if paused)
      const track = spotifyData.track;
      const startTime = Date.now() - track.progress;
      
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        timestamps: {
          start: Math.floor(startTime),
          end: Math.floor(startTime + track.duration),
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('DiscordProfile: Using Spotify OAuth integration data');
    } else {
      // Fall back to Discord activities only if no Spotify OAuth connection
      const discordSong = discordData?.activities?.find(activity => activity.type === 2);
      if (discordSong) {
        currentSong = discordSong;
        console.log('DiscordProfile: Using Discord activity data');
      }
    }

    // Store the last known song to keep displaying it even when stopped
    useEffect(() => {
      if (currentSong) {
        console.log('DiscordProfile: Storing last known song:', currentSong);
        setLastKnownSong(currentSong);
      }
    }, [currentSong]);

    // Use current song if available, otherwise show last known song
    const songToDisplay = currentSong || lastKnownSong;

    console.log('DiscordProfile: Final songToDisplay:', songToDisplay);
    console.log('DiscordProfile: About to render main component');

    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 shadow-2xl h-full flex flex-col rounded-none border-0">
        {/* Car Thing optimized horizontal layout - compact profile, prominent music */}
        <div className="flex-1 flex gap-3 min-h-0 p-3">
          {/* Left side - Compact Profile for Car Thing */}
          <div className="flex-shrink-0 w-[280px] min-h-0 overflow-hidden">
            <ProfileHeader 
              displayName={displayName}
              discriminator={discriminator}
              avatarUrl={avatarUrl}
              status={status}
              bannerUrl={bannerUrl}
              bio={bio}
              customStatus={customStatus}
              connections={connections}
            />
          </div>

          {/* Right side - Prominent Music Display for Car Thing */}
          <div className="flex-1 flex items-center min-w-0">
            {songToDisplay ? (
              <NowPlaying 
                currentSong={songToDisplay}
                isSpotifyConnected={isConnected}
                spotifyData={spotifyData}
              />
            ) : (
              <EmptyMusicState 
                isConnected={isConnected}
                onConnect={connectSpotify}
              />
            )}
          </div>
        </div>

        <WidgetFooter />
      </Card>
    );
  } catch (error) {
    console.error('DiscordProfile: Component error:', error);
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl h-full">
        <div className="text-center text-red-500">
          Error loading profile. Check console for details.
        </div>
      </Card>
    );
  }
};
