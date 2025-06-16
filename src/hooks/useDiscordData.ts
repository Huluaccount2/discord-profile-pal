
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);
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

  // Reduced interval and improved change detection
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

            // Always update data every few calls to ensure we don't miss changes
            const forceUpdate = Math.random() < 0.1; // 10% chance to force update
            
            if (
              currentCustomStatus !== lastCustomStatusRef.current ||
              currentSongKey !== lastSongKeyRef.current ||
              forceUpdate
            ) {
              console.log(
                'useDiscordData: State change detected. Previous status/song: ',
                lastCustomStatusRef.current, lastSongKeyRef.current,
                '→ Now:', currentCustomStatus, currentSongKey,
                forceUpdate ? '(forced update)' : ''
              );
              setDiscordData(data);
              lastCustomStatusRef.current = currentCustomStatus;
              lastSongKeyRef.current = currentSongKey;
            }
          }
        } catch (error) {
          console.error('useDiscordData: Error checking custom status/song:', error);
        }
      }, 1000); // Increased to 1 second to reduce load

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
