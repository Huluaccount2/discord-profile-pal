
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";

// Message cleanup utility
const cleanupOldLogs = () => {
  const MAX_CONSOLE_LOGS = 200;
  
  // Clear console to prevent memory issues
  if (typeof window !== 'undefined' && window.console) {
    try {
      console.clear();
      console.log('useDiscordData: Console cleared to prevent memory issues - message limit reached');
    } catch (e) {
      // Fallback if console.clear() fails
      console.log('useDiscordData: Attempted console cleanup');
    }
  }
};

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);
  const lastSongKeyRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);
  const { isRunningOnDeskThing } = useDeskThing();

  const logWithCleanup = (message: string, ...args: any[]) => {
    messageCountRef.current++;
    
    // Clean up every 200 messages
    if (messageCountRef.current >= 200) {
      cleanupOldLogs();
      messageCountRef.current = 0; // Reset counter after cleanup
      console.log(`useDiscordData: Message count reset after reaching 200 messages`);
    }
    
    console.log(message, ...args);
  };

  const fetchDiscordData = async () => {
    setRefreshing(true);
    try {
      if (isRunningOnDeskThing) {
        logWithCleanup('useDiscordData: Running on DeskThing, calling Discord function without auth');
        const { data, error } = await supabase.functions.invoke('discord-bot');
        
        if (error) {
          logWithCleanup('useDiscordData: Discord function error on DeskThing:', error);
        } else {
          logWithCleanup('useDiscordData: Discord data received on DeskThing:', data);
          setDiscordData(data);
          lastCustomStatusRef.current = data?.custom_status?.text || null;
          const latestSong = data?.activities?.find((a: any) => a.type === 2);
          lastSongKeyRef.current = latestSong ? makeSongKey(latestSong) : null;
        }
      } else {
        if (!userId) {
          logWithCleanup('useDiscordData: No userId provided for web usage');
          return;
        }
        logWithCleanup('useDiscordData: Fetching Discord data for userId:', userId);
        const { data, error } = await supabase.functions.invoke('discord-bot', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) {
          logWithCleanup('useDiscordData: Discord function error:', error);
        } else {
          logWithCleanup('useDiscordData: Discord data received:', data);
          setDiscordData(data);
          lastCustomStatusRef.current = data?.custom_status?.text || null;
          const latestSong = data?.activities?.find((a: any) => a.type === 2);
          lastSongKeyRef.current = latestSong ? makeSongKey(latestSong) : null;
        }
      }
    } catch (error) {
      logWithCleanup('useDiscordData: Error calling Discord function:', error);
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
      logWithCleanup('useDiscordData: Initial fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  // Reduced interval and improved change detection with cleanup
  useEffect(() => {
    if (!isRunningOnDeskThing && (!userId || !discordId)) return;
    if (isRunningOnDeskThing || (userId && discordId)) {
      logWithCleanup('useDiscordData: Setting up status/song check interval');
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
              // Only log significant changes to reduce message spam
              const hasStatusChange = currentCustomStatus !== lastCustomStatusRef.current;
              const hasSongChange = currentSongKey !== lastSongKeyRef.current;
              
              if (hasStatusChange || hasSongChange || forceUpdate) {
                logWithCleanup(
                  'useDiscordData: State change detected.',
                  hasStatusChange ? 'Status changed.' : '',
                  hasSongChange ? 'Song changed.' : '',
                  forceUpdate ? '(forced update)' : ''
                );
              }
              
              setDiscordData(data);
              lastCustomStatusRef.current = currentCustomStatus;
              lastSongKeyRef.current = currentSongKey;
            }
          }
        } catch (error) {
          logWithCleanup('useDiscordData: Error checking custom status/song:', error);
        }
      }, 1000); // 1 second interval

      return () => {
        logWithCleanup('useDiscordData: Cleaning up status/song check interval');
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
