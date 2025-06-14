
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
        
        // Update custom status tracking
        lastCustomStatusRef.current = data?.custom_status?.text || null;
      }
    } catch (error) {
      console.error('Error calling Discord function:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId && discordId) {
      fetchDiscordData();
    }
  }, [userId, discordId]);

  // Custom status refresh - check for status changes only
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
    }, 2000); // Check every 2 seconds for status changes

    return () => clearInterval(statusInterval);
  }, [userId, discordId]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
