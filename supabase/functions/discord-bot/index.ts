
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
  global_name?: string;
  banner?: string | null;
  bio?: string | null;
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

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  progress_ms: number;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack;
  progress_ms: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userToken = Deno.env.get('DISCORD_USER_TOKEN');

    if (!userToken) {
      throw new Error('Missing Discord user token');
    }

    console.log('Fetching Discord data with user token...');

    // Get user info using personal token
    const userResponse = await fetch(`https://discord.com/api/v10/users/@me`, {
      headers: {
        'Authorization': userToken,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user:', userResponse.status, await userResponse.text());
      throw new Error(`Failed to fetch Discord user: ${userResponse.status}`);
    }

    const userData: DiscordUser = await userResponse.json();
    console.log('User data fetched:', userData);

    // Get user connections to find Spotify access token and custom status
    let activitiesData: DiscordActivity[] = [];
    let userStatus: 'online' | 'idle' | 'dnd' | 'offline' = 'online';
    let customStatus: any = null;
    let connectionsData: any[] = [];
    
    try {
      // Fetch user settings to get custom status
      const settingsResponse = await fetch(`https://discord.com/api/v10/users/@me/settings`, {
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        if (settings.custom_status) {
          customStatus = settings.custom_status;
          console.log('Custom status fetched:', customStatus);
        }
      }

      const connectionsResponse = await fetch(`https://discord.com/api/v10/users/@me/connections`, {
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
      });

      if (connectionsResponse.ok) {
        const connections = await connectionsResponse.json();
        console.log('User connections fetched:', connections);
        
        // Filter and format connections for display
        connectionsData = connections
          .filter((conn: any) => conn.visibility === 1) // Only show public connections
          .map((conn: any) => ({
            type: conn.type,
            name: conn.name,
            id: conn.id,
            verified: conn.verified
          }));
        
        // Find Spotify connection with access token
        const spotifyConnection = connections.find((conn: any) => 
          conn.type === 'spotify' && conn.show_activity && conn.access_token
        );
        
        if (spotifyConnection && spotifyConnection.access_token) {
          console.log('Found Spotify connection with access token');
          
          try {
            // Try to fetch current playing with existing token
            let spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
              headers: {
                'Authorization': `Bearer ${spotifyConnection.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            // If token is invalid/expired, skip Spotify data for now
            // Discord connection tokens are managed by Discord and can't be refreshed by us
            if (spotifyResponse.ok && spotifyResponse.status !== 204) {
              const spotifyData: SpotifyCurrentlyPlaying = await spotifyResponse.json();
              console.log('Spotify currently playing:', spotifyData);
              
              if (spotifyData.is_playing && spotifyData.item) {
                const track = spotifyData.item;
                const artists = track.artists.map(artist => artist.name).join(', ');
                const albumCover = track.album.images.find(img => img.height >= 300)?.url || 
                                 track.album.images[0]?.url;
                
                const startTime = Date.now() - spotifyData.progress_ms;
                
                activitiesData = [
                  {
                    name: "Spotify",
                    type: 2, // Listening
                    details: track.name,
                    state: `by ${artists}`,
                    timestamps: {
                      start: Math.floor(startTime),
                      end: Math.floor(startTime + track.duration_ms),
                    },
                    assets: {
                      large_image: albumCover,
                      large_text: track.album.name,
                    },
                  }
                ];
                
                console.log('Created Spotify activity from Discord connection');
              } else {
                console.log('Spotify not currently playing or no track data');
              }
            } else if (spotifyResponse.status === 401) {
              console.log('Discord Spotify token expired - Discord needs to refresh it automatically');
              // Discord connection tokens are managed by Discord, we can't refresh them
              // The user needs to reconnect Spotify in Discord if the token stays expired
            } else {
              console.log('Spotify API response not ok or empty:', spotifyResponse.status);
            }
          } catch (spotifyError) {
            console.log('Error fetching Spotify data from Discord connection:', spotifyError);
          }
        } else {
          console.log('No Spotify connection with valid access token found');
        }
      }
    } catch (error) {
      console.log('Could not fetch connections or settings:', error);
    }

    // Since the user is making this request, we know they're online
    userStatus = 'online';

    // Initialize Supabase client only for web requests (not DeskThing)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (!userError && user) {
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
        }
      }
    }

    // Return the user data with only real music activities, custom status, and connections
    const responseData = {
      user: userData,
      status: userStatus,
      activities: activitiesData, // Only real Spotify data when available
      avatar_url: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256` : null,
      custom_status: customStatus,
      connections: connectionsData,
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
