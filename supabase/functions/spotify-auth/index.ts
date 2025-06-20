
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: {
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string; height: number; width: number }[];
    };
    duration_ms: number;
  } | null;
  progress_ms: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Spotify auth function called');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log('Invalid user token:', userError);
      throw new Error('Invalid user token');
    }

    console.log('Authenticated user:', user.id);

    // Parse request body to get action and frontend origin
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const frontendOrigin = body.frontendOrigin || 'http://localhost:3000';

    console.log('Action requested:', action);

    // Helper function to get and refresh access token
    const getValidAccessToken = async () => {
      console.log('Getting access token for user:', user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
        .eq('id', user.id)
        .single();

      if (!profile?.spotify_access_token) {
        console.log('No Spotify access token found for user');
        throw new Error('No Spotify connection');
      }

      let accessToken = profile.spotify_access_token;
      console.log('Current token expires at:', profile.spotify_token_expires_at);

      // Check if token needs refresh
      if (profile.spotify_token_expires_at && new Date(profile.spotify_token_expires_at) <= new Date()) {
        console.log('Token expired, attempting refresh...');
        
        const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
        const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

        if (!clientId || !clientSecret || !profile.spotify_refresh_token) {
          console.log('Missing credentials for token refresh');
          throw new Error('Cannot refresh token - missing credentials');
        }

        try {
          // Refresh the token
          const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: profile.spotify_refresh_token,
            }),
          });

          if (refreshResponse.ok) {
            const newTokens: SpotifyTokenResponse = await refreshResponse.json();
            accessToken = newTokens.access_token;
            console.log('Token refreshed successfully');

            // Update stored tokens
            await supabase
              .from('profiles')
              .update({
                spotify_access_token: newTokens.access_token,
                spotify_token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          } else {
            console.log('Failed to refresh token:', refreshResponse.status);
            throw new Error('Failed to refresh token');
          }
        } catch (refreshError) {
          console.log('Error during token refresh:', refreshError);
          throw new Error('Token refresh failed');
        }
      }

      return accessToken;
    };

    if (!action) {
      // Default action - generate authorization URL
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      if (!clientId) {
        throw new Error('Spotify client ID not configured');
      }

      const redirectUri = `${frontendOrigin}/auth/spotify/callback`;
      const scopes = 'user-read-currently-playing user-read-playback-state user-modify-playback-state user-read-recently-played';
      const state = user.id;

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}`;

      return new Response(JSON.stringify({ authUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'exchange-code') {
      // Exchange authorization code for access tokens
      const { code, state } = body;
      
      if (state !== user.id) {
        throw new Error('Invalid state parameter');
      }

      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('Spotify credentials not configured');
      }

      const redirectUri = `${frontendOrigin}/auth/spotify/callback`;

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens: SpotifyTokenResponse = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Failed to store tokens');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'current-track') {
      try {
        const accessToken = await getValidAccessToken();
        console.log('Making Spotify API request for current track');

        // Get currently playing track
        const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('Spotify API response status:', spotifyResponse.status);

        if (spotifyResponse.status === 204) {
          console.log('No track currently playing (204)');
          return new Response(JSON.stringify({ isPlaying: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (!spotifyResponse.ok) {
          console.log('Spotify API error:', spotifyResponse.status);
          return new Response(JSON.stringify({ isPlaying: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const currentTrack: SpotifyCurrentlyPlaying = await spotifyResponse.json();
        
        if (!currentTrack.is_playing || !currentTrack.item) {
          console.log('Track not playing or no item');
          return new Response(JSON.stringify({ isPlaying: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const track = currentTrack.item;
        const artists = track.artists.map(artist => artist.name).join(', ');
        const albumCover = track.album.images.find(img => img.height >= 300)?.url || track.album.images[0]?.url;

        console.log('Returning current track:', track.name);

        return new Response(JSON.stringify({
          isPlaying: true,
          track: {
            name: track.name,
            artist: artists,
            album: track.album.name,
            albumCover,
            duration: track.duration_ms,
            progress: currentTrack.progress_ms,
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.log('Error in current-track:', error);
        return new Response(JSON.stringify({ isPlaying: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (action === 'recently-played') {
      try {
        const accessToken = await getValidAccessToken();
        console.log('Making Spotify API request for recently played');

        const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!spotifyResponse.ok) {
          console.log('Recently played API error:', spotifyResponse.status);
          return new Response(JSON.stringify({ isPlaying: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const recentlyPlayed = await spotifyResponse.json();
        
        if (!recentlyPlayed.items || recentlyPlayed.items.length === 0) {
          console.log('No recently played tracks');
          return new Response(JSON.stringify({ isPlaying: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const track = recentlyPlayed.items[0].track;
        const artists = track.artists.map((artist: any) => artist.name).join(', ');
        const albumCover = track.album.images.find((img: any) => img.height >= 300)?.url || track.album.images[0]?.url;

        console.log('Returning recently played track:', track.name);

        return new Response(JSON.stringify({
          isPlaying: false,
          track: {
            name: track.name,
            artist: artists,
            album: track.album.name,
            albumCover,
            duration: track.duration_ms,
            progress: track.duration_ms,
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.log('Error in recently-played:', error);
        return new Response(JSON.stringify({ isPlaying: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Playback control actions
    if (action === 'play' || action === 'pause') {
      try {
        const accessToken = await getValidAccessToken();
        const endpoint = action === 'play' ? 'play' : 'pause';
        
        const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        return new Response(JSON.stringify({ success: response.ok }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.log('Error in playback control:', error);
        return new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (action === 'next' || action === 'previous') {
      try {
        const accessToken = await getValidAccessToken();
        const endpoint = action === 'next' ? 'next' : 'previous';
        
        const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        return new Response(JSON.stringify({ success: response.ok }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.log('Error in track control:', error);
        return new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in spotify-auth function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200, // Return 200 to prevent client-side errors
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
