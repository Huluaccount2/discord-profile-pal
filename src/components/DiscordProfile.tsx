
import { Card } from "@/components/ui/card";
import { DiscordProfileContent } from "@/components/discord/DiscordProfileContent";
import { useDiscordProfile } from "@/hooks/useDiscordProfile";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const DiscordProfile = () => {
  const {
    profile,
    loading,
    discordData,
    isLyricStatusActive,
    isLyricActive,
    isMonitoring,
    lyricError
  } = useDiscordProfile();

  if (loading) {
    console.log('DiscordProfile: Still loading profile...');
    return (
      <Card className="bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 shadow-2xl h-full">
        <div className="text-center text-white">Loading profile...</div>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <DiscordProfileContent
        profile={profile}
        discordData={discordData}
        isLyricStatusActive={isLyricStatusActive}
        isLyricActive={isLyricActive}
        isMonitoring={isMonitoring}
        lyricError={lyricError}
      />
    </ErrorBoundary>
  );
};
