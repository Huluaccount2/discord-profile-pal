
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

  useEffect(() => {
    if (userId && discordId) {
      fetchDiscordData();
    }
  }, [userId, discordId]);

  // Music refresh - check more frequently for song endings
  useEffect(() => {
    if (!userId || !discordId || !discordData) return;

    const musicInterval = setInterval(() => {
      if (shouldRefreshMusic()) {
        console.log('Refreshing due to music change');
        fetchDiscordData();
      }
    }, 1000); // Check every second for song endings

    return () => clearInterval(musicInterval);
  }, [userId, discordId, discordData]);

  // Custom status refresh - check less frequently for status changes
  useEffect(() => {
    if (!userId || !discordId) return;

    const statusInterval = setInterval(async () => {
      // Quick check for custom status changes only
      try {
        const { data, error } = await supabase.functions.invoke('discord-bot', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!error && data) {
          const currentCustomStatus = data.custom_status?.text || null;
          if (currentCustomStatus !== lastCustomStatusRef.current) {
            console.log('Custom status changed, refreshing');
            setDiscordData(data);
            lastCustomStatusRef.current = currentCustomStatus;
          }
        }
      } catch (error) {
        console.error('Error checking custom status:', error);
      }
    }, 5000); // Check every 5 seconds for status changes

    return () => clearInterval(statusInterval);
  }, [userId, discordId]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
