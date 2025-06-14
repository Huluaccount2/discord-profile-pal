
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastCustomStatusRef = useRef<string | null>(null);

  const fetchDiscordData = async () => {
    if (!userId) {
      console.log('useDiscordData: No userId provided');
      return;
    }

    setRefreshing(true);
    try {
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
        
        // Update custom status tracking
        lastCustomStatusRef.current = data?.custom_status?.text || null;
        console.log('useDiscordData: Custom status updated:', lastCustomStatusRef.current);
      }
    } catch (error) {
      console.error('useDiscordData: Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId && discordId) {
      console.log('useDiscordData: Initial fetch triggered');
      fetchDiscordData();
    }
  }, [userId, discordId]);

  // Custom status refresh - check for status changes only
  useEffect(() => {
    if (!userId || !discordId) return;

    console.log('useDiscordData: Setting up status check interval');
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
  }, [userId, discordId]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
