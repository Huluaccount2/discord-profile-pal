
import React from "react";
import { Card } from "@/components/ui/card";
import { ProfileHeader } from "@/components/discord/ProfileHeader";
import { NowPlaying } from "@/components/discord/NowPlaying";
import { EmptyMusicState } from "@/components/discord/EmptyMusicState";
import { WidgetFooter } from "@/components/discord/WidgetFooter";
import { LyricStatusIndicator } from "@/components/discord/LyricStatusIndicator";
import { useMusicData } from "@/hooks/useMusicData";

interface DiscordProfileContentProps {
  profile: any;
  discordData: any;
  isLyricStatusActive: boolean;
  isLyricActive: boolean;
  isMonitoring: boolean;
  lyricError: string | null;
}

export const DiscordProfileContent = React.memo(({
  profile,
  discordData,
  isLyricStatusActive,
  isLyricActive,
  isMonitoring,
  lyricError
}: DiscordProfileContentProps) => {
  const {
    spotifyData,
    isConnected,
    connectSpotify,
    songToDisplay,
    shouldShowConnectPrompt,
    loading,
    play,
    pause,
    nextTrack,
    previousTrack
  } = useMusicData(profile, discordData);

  const displayName = discordData?.user?.username || profile?.discord_username || profile?.username || "User";
  const discriminator = discordData?.user?.discriminator || profile?.discord_discriminator || "0000";
  const avatarUrl = discordData?.avatar_url || profile?.discord_avatar || profile?.avatar_url || null;
  const status = discordData?.status || 'offline';

  console.log('DiscordProfileContent: Display data:', { displayName, discriminator, avatarUrl, status });

  const bannerUrl = discordData?.user?.banner ? 
    `https://cdn.discordapp.com/banners/${discordData.user.id}/${discordData.user.banner}.png?size=600` : 
    null;

  const bio = discordData?.user?.bio || null;
  const customStatus = discordData?.custom_status || null;
  const connections = discordData?.connections || [];

  return (
    <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 shadow-2xl h-full flex flex-col rounded-none border-0">
      <div className="flex-1 flex gap-2 min-h-0 p-2">
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
          <div className="mt-2 flex justify-center">
            <LyricStatusIndicator 
              isActive={isLyricActive || isLyricStatusActive} 
              isMonitoring={isMonitoring}
              error={lyricError}
            />
          </div>
        </div>

        <div className="flex-1 flex items-start min-w-0 px-2 pb-8">
          {songToDisplay ? (
            <NowPlaying 
              currentSong={songToDisplay}
              isSpotifyConnected={isConnected}
              spotifyData={spotifyData}
              onPlay={play}
              onPause={pause}
              onNext={nextTrack}
              onPrevious={previousTrack}
            />
          ) : shouldShowConnectPrompt ? (
            <EmptyMusicState 
              isConnected={isConnected}
              onConnect={connectSpotify}
              isLoading={loading}
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
});

DiscordProfileContent.displayName = 'DiscordProfileContent';
