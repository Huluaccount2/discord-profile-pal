
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const fetchDiscordDataFromAPI = async (
  isRunningOnDeskThing: boolean,
  userId?: string
): Promise<{ data: DiscordData | null; error: any }> => {
  try {
    if (isRunningOnDeskThing) {
      // For DeskThing, we don't use Supabase functions
      // Data comes through RPC events instead
      console.log('fetchDiscordDataFromAPI: Running on DeskThing, data comes via RPC');
      return { data: null, error: 'DeskThing uses RPC events, not HTTP API' };
    } else {
      if (!userId) {
        return { data: null, error: 'No userId provided for web usage' };
      }
      
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: 'No authenticated session' };
      }
      
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });
      return { data, error };
    }
  } catch (error) {
    console.error('fetchDiscordDataFromAPI error:', error);
    return { data: null, error };
  }
};

export const makeSongKey = (song: any): string => {
  if (!song) return "";
  return [
    song.details,
    song.state,
    song.timestamps?.start,
    song.timestamps?.end,
    song.assets?.large_image
  ].join("|");
};
