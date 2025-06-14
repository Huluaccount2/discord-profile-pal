
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface DiscordActivity {
  name: string;
  type: number;
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
}

interface DiscordPresence {
  user: DiscordUser;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: DiscordActivity[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const userId = Deno.env.get('DISCORD_USER_ID');

    if (!botToken || !userId) {
      throw new Error('Missing Discord credentials');
    }

    console.log('Fetching Discord data for user:', userId);

    // Get user info
    const userResponse = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user:', userResponse.status, await userResponse.text());
      throw new Error(`Failed to fetch Discord user: ${userResponse.status}`);
    }

    const userData: DiscordUser = await userResponse.json();
    console.log('User data fetched:', userData);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Update the user's profile with Discord data
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        discord_id: userData.id,
        discord_username: userData.username,
        discord_discriminator: userData.discriminator,
        discord_avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256` : null,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update profile');
    }

    // Try to fetch presence data (this requires the bot to be in a server with the user)
    // For now, we'll return the user data and a placeholder for activities
    const responseData = {
      user: userData,
      status: 'online' as const,
      activities: [] as DiscordActivity[],
      avatar_url: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256` : null,
    };

    console.log('Discord data processed successfully');

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in discord-bot function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
