
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDiscordData } from "@/hooks/useDiscordData";
import { useLyricStatus } from "@/hooks/useLyricStatus";

export const useDiscordProfile = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const { discordData, refreshing, fetchDiscordData, isLyricStatusActive } = useDiscordData(user?.id, profile?.discord_id);
  const { currentLyric, isActive: isLyricActive, isMonitoring, error: lyricError } = useLyricStatus();

  console.log('useDiscordProfile: Rendering with user:', user?.id, 'profile:', profile, 'loading:', loading);
  console.log('useDiscordProfile: Discord data:', { discordData, refreshing });
  console.log('useDiscordProfile: Lyric Status active:', isLyricStatusActive);
  console.log('useDiscordProfile: File-based Lyric Status:', { isLyricActive, isMonitoring, lyricError });

  // Optimized timer effect - only update when needed
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds instead of every second
    return () => clearInterval(timer);
  }, []); // Empty dependency array to prevent re-creation

  return {
    user,
    profile,
    loading,
    discordData,
    refreshing,
    fetchDiscordData,
    isLyricStatusActive,
    currentLyric,
    isLyricActive,
    isMonitoring,
    lyricError,
    currentTime
  };
};
