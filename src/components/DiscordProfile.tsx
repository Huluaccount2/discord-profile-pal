
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
import { useLastKnownSong } from "@/hooks/useLastKnownSong";

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { discordData, refreshing, fetchDiscordData } = useDiscordData(user?.id, profile?.discord_id);
  const { 
    spotifyData, 
    isConnected, 
    connectSpotify,
    connectionError
  } = useSpotify(user?.id);

  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();

  console.log('DiscordProfile: Rendering with user:', user?.id, 'profile:', profile, 'loading:', loading);
  console.log('DiscordProfile: Spotify connection status:', { isConnected, connectionError });
  console.log('DiscordProfile: Discord data:', { discordData, refreshing });
  console.log('DiscordProfile: Spotify data:', spotifyData);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current song data with improved priority logic
  let currentSong = null;
  if (profile && discordData) {
    console.log('DiscordProfile: Processing music data...');

    // Priority 1: Spotify OAuth if connected and has current track
    if (isConnected && spotifyData?.track && spotifyData?.isPlaying) {
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
      console.log('DiscordProfile: Using Spotify OAuth current track');
    }
    // Priority 2: Spotify OAuth last played if connected but not currently playing
    else if (isConnected && spotifyData?.lastPlayed) {
      const track = spotifyData.lastPlayed;
      const now = Date.now();
      currentSong = {
        name: "Spotify",
        type: 2,
        details: track.name,
        state: track.artist,
        timestamps: {
          start: now - track.duration,
          end: now,
        },
        assets: {
          large_image: track.albumCover,
          large_text: track.album,
        },
      };
      console.log('DiscordProfile: Using Spotify OAuth last played track');
    }
    // Priority 3: Discord activities (if Discord Spotify token works)
    else {
      const discordSong = discordData?.activities?.find(activity => activity.type === 2);
      if (discordSong) {
        currentSong = discordSong;
        console.log('DiscordProfile: Using Discord activity data');
      } else {
        console.log('DiscordProfile: No Discord music activity found');
      }
    }
  }

  // Store any current song in localStorage
  useEffect(() => {
    if (currentSong) {
      console.log('DiscordProfile: Storing current song in localStorage:', currentSong);
      setLastKnownSong(currentSong);
    }
  }, [currentSong, setLastKnownSong]);

  if (loading) {
    console.log('DiscordProfile: Still loading profile...');
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl h-full">
        <div className="text-center text-white">Loading profile...</div>
      </Card>
    );
  }

  try {
    const displayName = discordData?.user?.username || profile?.discord_username || profile?.username || "User";
    const discriminator = discordData?.user?.discriminator || profile?.discord_discriminator || "0000";
    const avatarUrl = discordData?.avatar_url || profile?.discord_avatar || profile?.avatar_url || null;
    const status = discordData?.status || 'offline';

    console.log('DiscordProfile: Display data:', { displayName, discriminator, avatarUrl, status });

    const bannerUrl = discordData?.user?.banner ? 
      `https://cdn.discordapp.com/banners/${discordData.user.id}/${discordData.user.banner}.png?size=600` : 
      null;

    const bio = discordData?.user?.bio || null;
    const customStatus = discordData?.custom_status || null;
    const connections = discordData?.connections || [];

    // Final song selection: current song or last known song
    let songToDisplay = currentSong || lastKnownSong;
    const shouldShowConnectPrompt = !isConnected && !songToDisplay;

    console.log('DiscordProfile: Final song selection:', { 
      currentSong: currentSong ? 'present' : 'null',
      lastKnownSong: lastKnownSong ? 'present' : 'null',
      songToDisplay: songToDisplay ? 'present' : 'null',
      shouldShowConnectPrompt 
    });

    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 shadow-2xl h-full flex flex-col rounded-none border-0">
        <div className="flex-1 flex gap-3 min-h-0 p-3">
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

          <div className="flex-1 flex items-center min-w-0">
            {songToDisplay ? (
              <NowPlaying 
                currentSong={songToDisplay}
                isSpotifyConnected={isConnected}
                spotifyData={spotifyData}
              />
            ) : shouldShowConnectPrompt ? (
              <EmptyMusicState 
                isConnected={isConnected}
                onConnect={connectSpotify}
              />
            ) : (
              <div className="text-white text-center w-full">
                No music currently detected.
              </div>
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
