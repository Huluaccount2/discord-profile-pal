
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);

  // NEW: Also track the last detected song/activity (by type 2 for Spotify)
  const lastSongKeyRef = useRef<string | null>(null);
  const { isRunningOnDeskThing } = useDeskThing();

  const fetchDiscordData = async () => {
    setRefreshing(true);
    try {
      if (isRunningOnDeskThing) {
        console.log('useDiscordData: Running on DeskThing, calling Discord function without auth');
        const { data, error } = await supabase.functions.invoke('discord-bot');
        
        if (error) {
          console.error('useDiscordData: Discord function error on DeskThing:', error);
        } else {
          console.log('useDiscordData: Discord data received on DeskThing:', data);
          setDiscordData(data);
          lastCustomStatusRef.current = data?.custom_status?.text || null;
          // Update the last song/activity key as well
          const latestSong = data?.activities?.find((a: any) => a.type === 2);
          lastSongKeyRef.current = latestSong ? makeSongKey(latestSong) : null;
        }
      } else {
        if (!userId) {
          console.log('useDiscordData: No userId provided for web usage');
          return;
        }
        console.log('useDiscordData: Fetching Discord data for userId:', userId);
        const { data, error } = await supabase.functions.invoke('discord-bot', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) {
          console.error('useDiscordData: Discord function error:', error);
        } else {
          console.log('useDiscordData: Discord data received:', data);
          setDiscordData(data);
          lastCustomStatusRef.current = data?.custom_status?.text || null;
          // Update the last song/activity key as well
          const latestSong = data?.activities?.find((a: any) => a.type === 2);
          lastSongKeyRef.current = latestSong ? makeSongKey(latestSong) : null;
        }
      }
    } catch (error) {
      console.error('useDiscordData: Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Utility: build a unique identifier for the currently playing song/activity
  const makeSongKey = (song: any) => {
    if (!song) return "";
    return [
      song.details,
      song.state,
      song.timestamps?.start,
      song.timestamps?.end,
      song.assets?.large_image
    ].join("|");
  };

  useEffect(() => {
    if (isRunningOnDeskThing || (userId && discordId)) {
      console.log('useDiscordData: Initial fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  // Custom status & activity refresh - check for changes in either custom status or music activity
  useEffect(() => {
    if (!isRunningOnDeskThing && (!userId || !discordId)) return;
    if (isRunningOnDeskThing || (userId && discordId)) {
      console.log('useDiscordData: Setting up status/song check interval');
      const statusInterval = setInterval(async () => {
        try {
          let data, error;
          if (isRunningOnDeskThing) {
            ({ data, error } = await supabase.functions.invoke('discord-bot'));
          } else {
            ({ data, error } = await supabase.functions.invoke('discord-bot', {
              headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
            }));
          }

          if (!error && data) {
            const currentCustomStatus = data.custom_status?.text || null;
            const currentSong = data?.activities?.find((a: any) => a.type === 2);
            const currentSongKey = currentSong ? makeSongKey(currentSong) : null;

            // Detect: EITHER custom status OR song key change
            if (
              currentCustomStatus !== lastCustomStatusRef.current ||
              currentSongKey !== lastSongKeyRef.current
            ) {
              console.log(
                'useDiscordData: Detected state change. Previous status/song: ',
                lastCustomStatusRef.current, lastSongKeyRef.current,
                '→ Now:', currentCustomStatus, currentSongKey
              );
              setDiscordData(data);
              lastCustomStatusRef.current = currentCustomStatus;
              lastSongKeyRef.current = currentSongKey;
            }
          }
        } catch (error) {
          console.error('useDiscordData: Error checking custom status/song:', error);
        }
      }, 100); // 100ms interval

      return () => {
        console.log('useDiscordData: Cleaning up status/song check interval');
        clearInterval(statusInterval);
      };
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
