
import { useState, useEffect, useRef } from "react";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";
import { createLogWithCleanup } from "@/utils/discordLogging";
import { fetchDiscordDataFromAPI, makeSongKey } from "@/utils/discordDataFetcher";
import { AdaptivePolling } from "@/utils/adaptivePolling";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);
  const lastSongKeyRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);
  const pollIntervalRef = useRef(50); // Start with 50ms
  const unchangedCountRef = useRef(0); // Track consecutive unchanged polls
  const { isRunningOnDeskThing } = useDeskThing();

  const logWithCleanup = createLogWithCleanup(messageCountRef);
  const adaptivePolling = new AdaptivePolling(pollIntervalRef, unchangedCountRef, logWithCleanup);

  const fetchDiscordData = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await fetchDiscordDataFromAPI(isRunningOnDeskThing, userId);
      
      if (isRunningOnDeskThing) {
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
            const { data, error } = await fetchDiscordDataFromAPI(isRunningOnDeskThing, userId);

            if (!error && data) {
              const currentCustomStatus = data.custom_status?.text || null;
              const currentSong = data?.activities?.find((a: any) => a.type === 2);
              const currentSongKey = currentSong ? makeSongKey(currentSong) : null;

              // Check for actual changes
              const hasStatusChange = currentCustomStatus !== lastCustomStatusRef.current;
              const hasSongChange = currentSongKey !== lastSongKeyRef.current;
              const hasChanges = hasStatusChange || hasSongChange;
              
              // Update polling interval based on changes
              adaptivePolling.updateInterval(hasChanges);
              
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
            adaptivePolling.updateInterval(false);
          }
          
          // Schedule next poll with current interval
          scheduleNextPoll();
        }, adaptivePolling.getCurrentInterval());
      };

      // Start the adaptive polling
      scheduleNextPoll();

      return () => {
        logWithCleanup('useDiscordData: Cleaning up adaptive polling');
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // Reset intervals on cleanup
        adaptivePolling.reset();
      };
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
