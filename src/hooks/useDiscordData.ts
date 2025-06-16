
import { useState, useEffect, useRef } from "react";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";
import { createLogWithCleanup } from "@/utils/discordLogging";
import { fetchDiscordDataFromAPI, makeSongKey } from "@/utils/discordDataFetcher";
import { AdaptivePolling } from "@/utils/adaptivePolling";
import { deskthingIntegration } from "@/utils/deskthing";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLyricStatusActive, setIsLyricStatusActive] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);
  const lastSongKeyRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);
  const pollIntervalRef = useRef(200);
  const unchangedCountRef = useRef(0);
  const { isRunningOnDeskThing } = useDeskThing();

  const logWithCleanup = createLogWithCleanup(messageCountRef);
  const adaptivePolling = new AdaptivePolling(pollIntervalRef, unchangedCountRef, logWithCleanup);

  // DeskThing RPC-based data fetching
  useEffect(() => {
    if (isRunningOnDeskThing) {
      logWithCleanup('useDiscordData: Setting up DeskThing RPC integration');
      
      const unsubscribe = deskthingIntegration.onDiscordData((data) => {
        if (data.type === 'profile_data') {
          logWithCleanup('useDiscordData: Received Discord profile from RPC:', data.payload);
          setDiscordData(data.payload);
          lastCustomStatusRef.current = data.payload?.custom_status?.text || null;
          const latestSong = data.payload?.activities?.find((a: any) => a.type === 2);
          lastSongKeyRef.current = latestSong ? makeSongKey(latestSong) : null;
        }
      });

      // Request initial profile data
      deskthingIntegration.requestDiscordProfile();

      return () => {
        logWithCleanup('useDiscordData: Cleaning up DeskThing RPC integration');
        unsubscribe();
      };
    }
  }, [isRunningOnDeskThing, logWithCleanup]);

  const fetchDiscordData = async () => {
    if (isRunningOnDeskThing) {
      // For DeskThing, request fresh data from RPC
      deskthingIntegration.requestDiscordProfile();
      return;
    }

    // Fallback to HTTP API for web usage
    setRefreshing(true);
    try {
      const { data, error } = await fetchDiscordDataFromAPI(false, userId);
      
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
    } catch (error) {
      logWithCleanup('useDiscordData: Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isRunningOnDeskThing) {
      // DeskThing uses RPC, no initial fetch needed here
      return;
    }

    if (userId && discordId) {
      logWithCleanup('useDiscordData: Initial web fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  // Adaptive polling only for web usage
  useEffect(() => {
    if (isRunningOnDeskThing) {
      // DeskThing uses real-time RPC events, no polling needed
      return;
    }

    if (!userId || !discordId) return;
    
    logWithCleanup('useDiscordData: Setting up web polling');
    
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNextPoll = () => {
      timeoutId = setTimeout(async () => {
        try {
          const { data, error } = await fetchDiscordDataFromAPI(false, userId);

          if (!error && data) {
            const currentCustomStatus = data.custom_status?.text || null;
            const currentSong = data?.activities?.find((a: any) => a.type === 2);
            const currentSongKey = currentSong ? makeSongKey(currentSong) : null;

            const hasStatusChange = currentCustomStatus !== lastCustomStatusRef.current;
            const hasSongChange = currentSongKey !== lastSongKeyRef.current;
            const hasChanges = hasStatusChange || hasSongChange;
            
            adaptivePolling.updateInterval(hasChanges);
            setIsLyricStatusActive(adaptivePolling.isLyricStatusMode());
            
            if (hasChanges) {
              logWithCleanup(
                'useDiscordData: State change detected.',
                hasStatusChange ? 'Status changed.' : '',
                hasSongChange ? 'Song changed.' : '',
                adaptivePolling.isLyricStatusMode() ? '[Lyric Status mode]' : ''
              );
              
              setDiscordData(data);
              lastCustomStatusRef.current = currentCustomStatus;
              lastSongKeyRef.current = currentSongKey;
            }
          }
        } catch (error) {
          logWithCleanup('useDiscordData: Error checking status/song:', error);
          adaptivePolling.updateInterval(false);
        }
        
        scheduleNextPoll();
      }, adaptivePolling.getCurrentInterval());
    };

    scheduleNextPoll();

    return () => {
      logWithCleanup('useDiscordData: Cleaning up web polling');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      adaptivePolling.reset();
      setIsLyricStatusActive(false);
    };
  }, [userId, discordId, isRunningOnDeskThing]);

  return {
    discordData,
    refreshing,
    fetchDiscordData,
    isLyricStatusActive
  };
};
