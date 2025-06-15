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
import { toast } from "@/components/ui/use-toast";

export const DiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { discordData, refreshing, fetchDiscordData } = useDiscordData(user?.id, profile?.discord_id);

  // Spotify logic: catch errors gracefully
  let spotifyErrorMsg = null;
  let isConnected = false;
  let spotifyData = null;
  let connectSpotify = () => {};
  let connectionError = null;

  try {
    // Defensive: wrap Spotify hook in a try-catch to prevent a crash if function bails
    const spotifyResult = useSpotify(user?.id);
    isConnected = spotifyResult.isConnected;
    spotifyData = spotifyResult.spotifyData;
    connectSpotify = spotifyResult.connectSpotify;
    connectionError = spotifyResult.connectionError;
    if (connectionError) {
      spotifyErrorMsg = typeof connectionError === "string"
        ? connectionError
        : "Spotify connection failed. (See logs)";
      console.error("DiscordProfile: Spotify error in hook:", connectionError);
    }
  } catch (err) {
    spotifyErrorMsg = "Spotify error (hook crashed): " + ((err as Error)?.message || String(err));
    console.error("DiscordProfile: Caught fatal error in Spotify hook:", err);
  }

  // Use refactored hook for localStorage song
  const [lastKnownSong, setLastKnownSong] = useLastKnownSong();

  console.log('DiscordProfile: Rendering with user:', user?.id, 'profile:', profile, 'loading:', loading);
  console.log('DiscordProfile: Spotify connection status:', { isConnected, connectionError });

  // Timer effect - must be at top level
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current song data, but only if no Spotify error (if error, skip)
  let currentSong = null;
  if (profile && discordData && !spotifyErrorMsg) {
    try {
      if (isConnected && spotifyData?.track) {
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
      } else if (isConnected && spotifyData?.lastPlayed) {
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
      } else {
        // Fallback on Discord activities
        const discordSong = discordData?.activities?.find(a => a.type === 2);
        if (discordSong) {
          currentSong = discordSong;
        }
      }
    } catch (err) {
      // Even a crash here won't kill notifications
      console.error("DiscordProfile: Song calculation error:", err);
      currentSong = null;
    }
  }

  // Whenever a 'currentSong' is picked up, write it to both local state and localStorage
  useEffect(() => {
    if (currentSong) {
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

    const bio = discordData?.user?.bio || null;
    const customStatus = discordData?.custom_status || null;
    const connections = discordData?.connections || [];

    // New: show currentSong only if Spotify is working; otherwise fallback on lastKnownSong
    let songToDisplay = currentSong || lastKnownSong;
    const shouldShowConnectPrompt = !isConnected && !songToDisplay && !spotifyErrorMsg;

    console.log('DiscordProfile: Final songToDisplay:', songToDisplay);
    console.log('DiscordProfile: Show connect prompt?', shouldShowConnectPrompt);

    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 shadow-2xl h-full flex flex-col rounded-none border-0">
        {/* Car Thing optimized horizontal layout - compact profile, prominent music */}
        <div className="flex-1 flex gap-3 min-h-0 p-3">
          {/* Left side - Compact Profile */}
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

          {/* Right side - Music or prompt based on state */}
          <div className="flex-1 flex items-center min-w-0">
            {spotifyErrorMsg ? (
              <div className="w-full text-center">
                {/* Notifications always render! */}
                <NowPlaying 
                  currentSong={null}
                  isSpotifyConnected={false}
                  spotifyData={null}
                />
                <div className="text-red-400 my-3">
                  <b>Spotify Error:</b> {spotifyErrorMsg}
                  <br />
                  <span className="text-white/60">
                    Notifications will still be shown.
                  </span>
                </div>
              </div>
            ) : songToDisplay ? (
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
              // If connected, but somehow NO song, you could show a neutral empty state if preferred.
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
    console.error("DiscordProfile: Component error:", error);
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl h-full">
        <div className="text-center text-red-500">
          Error loading profile. Check console for details.
        </div>
      </Card>
    );
  }
};
