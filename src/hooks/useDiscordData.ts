
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";
import { useDeskThing } from "@/contexts/DeskThingContext";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);
  const { isRunningOnDeskThing } = useDeskThing();

  const fetchDiscordData = async () => {
    setRefreshing(true);
    try {
      if (isRunningOnDeskThing) {
        console.log('useDiscordData: Running on DeskThing, calling Discord function without auth');
        // For DeskThing, call the function without authentication
        // The server will handle Discord tokens via its own configuration
        const { data, error } = await supabase.functions.invoke('discord-bot');
        
        if (error) {
          console.error('useDiscordData: Discord function error on DeskThing:', error);
        } else {
          console.log('useDiscordData: Discord data received on DeskThing:', data);
          setDiscordData(data);
          lastCustomStatusRef.current = data?.custom_status?.text || null;
        }
      } else {
        // Regular web usage with authentication
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
        }
      }
    } catch (error) {
      console.error('useDiscordData: Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isRunningOnDeskThing || (userId && discordId)) {
      console.log('useDiscordData: Initial fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId, isRunningOnDeskThing]);

  // Custom status refresh - check for status changes only
  useEffect(() => {
    if (!isRunningOnDeskThing && (!userId || !discordId)) return;
    if (isRunningOnDeskThing || (userId && discordId)) {
      console.log('useDiscordData: Setting up status check interval');
      const statusInterval = setInterval(async () => {
        // Quick check for custom status changes only
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
            if (currentCustomStatus !== lastCustomStatusRef.current) {
              console.log('useDiscordData: Custom status changed from', lastCustomStatusRef.current, 'to', currentCustomStatus);
              setDiscordData(data);
              lastCustomStatusRef.current = currentCustomStatus;
            }
          }
        } catch (error) {
          console.error('useDiscordData: Error checking custom status:', error);
        }
      }, 100); // Check every 100ms for status changes

      return () => {
        console.log('useDiscordData: Cleaning up status check interval');
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
