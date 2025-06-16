
import { supabase } from "@/integrations/supabase/client";
import { DiscordData } from "@/types/discord";

export const fetchDiscordDataFromAPI = async (
  isRunningOnDeskThing: boolean,
  userId?: string
): Promise<{ data: DiscordData | null; error: any }> => {
  try {
    if (isRunningOnDeskThing) {
      const { data, error } = await supabase.functions.invoke('discord-bot');
      return { data, error };
    } else {
      if (!userId) {
        return { data: null, error: 'No userId provided for web usage' };
      }
      
      const { data, error } = await supabase.functions.invoke('discord-bot', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      return { data, error };
    }
  } catch (error) {
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
