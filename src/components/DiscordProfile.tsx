
import { Card } from "@/components/ui/card";
import { DiscordProfileContent } from "@/components/discord/DiscordProfileContent";
import { useDiscordProfile } from "@/hooks/useDiscordProfile";

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

  try {
    return (
      <DiscordProfileContent
        profile={profile}
        discordData={discordData}
        isLyricStatusActive={isLyricStatusActive}
        isLyricActive={isLyricActive}
        isMonitoring={isMonitoring}
        lyricError={lyricError}
      />
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
