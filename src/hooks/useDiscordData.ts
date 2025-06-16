

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
  const pollIntervalRef = useRef(50); // Start with 50ms (changed from 500ms)
  const unchangedCountRef = useRef(0); // Track consecutive unchanged polls
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

  // Adaptive polling function
  const updatePollInterval = (hasChanges: boolean) => {
    if (hasChanges) {
      // Reset to fast polling when changes detected
      unchangedCountRef.current = 0;
      pollIntervalRef.current = 50; // Reset to 50ms (changed from 500ms)
      logWithCleanup('useDiscordData: Changes detected, reset to fast polling (50ms)');
    } else {
      // Increase interval when no changes
      unchangedCountRef.current++;
      
      if (unchangedCountRef.current >= 3 && pollIntervalRef.current < 2000) {
        pollIntervalRef.current = 2000; // After 3 unchanged, go to 2s
        logWithCleanup('useDiscordData: No changes for 3 polls, slowing to 2s');
      } else if (unchangedCountRef.current >= 10 && pollIntervalRef.current < 5000) {
        pollIntervalRef.current = 5000; // After 10 unchanged, go to 5s
        logWithCleanup('useDiscordData: No changes for 10 polls, slowing to 5s');
      }
    }
  };

  useEffect(() => {
    if (isRunningOnDeskThing || (userId && discordId)) {
      logWithCleanup('useDiscordData: Initial fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  // Adaptive polling with smart interval adjustment
  useEffect(() => {
    if (!isRunningOnDeskThing && (!userId || !discordId)) return;
    if (isRunningOnDeskThing || (userId && discordId)) {
      logWithCleanup('useDiscordData: Setting up adaptive status/song check interval');
      
      let timeoutId: NodeJS.Timeout;
      
      const scheduleNextPoll = () => {
        timeoutId = setTimeout(async () => {
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

              // Check for actual changes
              const hasStatusChange = currentCustomStatus !== lastCustomStatusRef.current;
              const hasSongChange = currentSongKey !== lastSongKeyRef.current;
              const hasChanges = hasStatusChange || hasSongChange;
              
              // Update polling interval based on changes
              updatePollInterval(hasChanges);
              
              if (hasChanges) {
                logWithCleanup(
                  'useDiscordData: State change detected.',
                  hasStatusChange ? 'Status changed.' : '',
                  hasSongChange ? 'Song changed.' : ''
                );
                
                setDiscordData(data);
                lastCustomStatusRef.current = currentCustomStatus;
                lastSongKeyRef.current = currentSongKey;
              }
            }
          } catch (error) {
            logWithCleanup('useDiscordData: Error checking custom status/song:', error);
            // On error, slow down polling
            updatePollInterval(false);
          }
          
          // Schedule next poll with current interval
          scheduleNextPoll();
        }, pollIntervalRef.current);
      };

      // Start the adaptive polling
      scheduleNextPoll();

      return () => {
        logWithCleanup('useDiscordData: Cleaning up adaptive polling');
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // Reset intervals on cleanup
        pollIntervalRef.current = 50; // Reset to 50ms (changed from 500ms)
        unchangedCountRef.current = 0;
      };
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};

