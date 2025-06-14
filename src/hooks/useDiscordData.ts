
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const useDiscordData = (userId: string | undefined, discordId: string | null) => {
  const [discordData, setDiscordData] = useState<DiscordData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastActivityRef = useRef<any>(null);

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
        
        // Update activity tracking
        const currentActivity = data?.activities?.find((activity: any) => activity.type === 2);
        lastActivityRef.current = currentActivity;
        console.log('useDiscordData: Music activity updated:', currentActivity);
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

  // More frequent updates for music activity changes
  useEffect(() => {
    if (!userId || !discordId) return;

    console.log('useDiscordData: Setting up activity check interval');
    const activityInterval = setInterval(async () => {
      // Check for music activity changes more frequently
      try {
        const { data, error } = await supabase.functions.invoke('discord-bot', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!error && data) {
          const currentActivity = data.activities?.find((activity: any) => activity.type === 2);
          const lastActivity = lastActivityRef.current;
          
          // Check if music activity has changed
          if (JSON.stringify(currentActivity) !== JSON.stringify(lastActivity)) {
            console.log('useDiscordData: Music activity changed, updating data');
            setDiscordData(data);
            lastActivityRef.current = currentActivity;
          }
        }
      } catch (error) {
        console.error('useDiscordData: Error checking activity:', error);
      }
    }, 2000); // Check every 2 seconds for music activity changes

    return () => {
      console.log('useDiscordData: Cleaning up activity check interval');
      clearInterval(activityInterval);
    };
  }, [userId, discordId]);

  return {
    discordData,
    refreshing,
    fetchDiscordData
  };
};
