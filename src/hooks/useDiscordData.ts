
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastSongRef = useRef<string | null>(null);
  const lastSongEndRef = useRef<number | null>(null);
  const lastCustomStatusRef = useRef<string | null>(null);

  const fetchDiscordData = async () => {
    if (!userId) return;

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
      } else {
        console.log('Discord data received:', data);
        setDiscordData(data);
        
        // Update song tracking
        const currentSong = data?.activities?.find((activity: any) => activity.type === 2);
        if (currentSong) {
          const songId = `${currentSong.details}-${currentSong.state}`;
          lastSongRef.current = songId;
          lastSongEndRef.current = currentSong.timestamps?.end || null;
        } else {
          lastSongRef.current = null;
          lastSongEndRef.current = null;
        }
        
        // Update custom status tracking
        lastCustomStatusRef.current = data?.custom_status?.text || null;
      }
    } catch (error) {
      console.error('Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const shouldRefreshMusic = () => {
    if (!discordData) return true;
    
    const currentSong = discordData.activities?.find(activity => activity.type === 2);
    
    // If there's no current song but we had one before, refresh
    if (!currentSong && lastSongRef.current) return true;
    
    // If there's a current song
    if (currentSong) {
      const songId = `${currentSong.details}-${currentSong.state}`;
      
      // If it's a different song, refresh
      if (songId !== lastSongRef.current) return true;
      
      // If the song has an end time and we've passed it, refresh
      if (currentSong.timestamps?.end && Date.now() >= currentSong.timestamps.end) {
        return true;
      }
    }
    
    return false;
  };

  const shouldRefreshCustomStatus = () => {
    if (!discordData) return true;
    
    const currentCustomStatus = discordData.custom_status?.text || null;
    return currentCustomStatus !== lastCustomStatusRef.current;
  };

  useEffect(() => {
    if (userId && discordId) {
      fetchDiscordData();
    }
  }, [userId, discordId]);

  // Combined refresh interval - check both custom status and music every 2 seconds
  useEffect(() => {
    if (!userId || !discordId) return;

    const refreshInterval = setInterval(() => {
      const needsMusicRefresh = shouldRefreshMusic();
      const needsCustomStatusRefresh = shouldRefreshCustomStatus();
      
      if (needsMusicRefresh || needsCustomStatusRefresh) {
        console.log('Refreshing due to:', { needsMusicRefresh, needsCustomStatusRefresh });
        fetchDiscordData();
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(refreshInterval);
  }, [userId, discordId, discordData]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
