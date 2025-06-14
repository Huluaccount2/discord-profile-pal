
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
  };
  progress_ms: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Parse request body to get action
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (!action) {
      // Default action - generate authorization URL
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      if (!clientId) {
        throw new Error('Spotify client ID not configured');
      }

      const redirectUri = `${new URL(req.url).origin}/auth/spotify/callback`;
      const scopes = 'user-read-currently-playing user-read-playback-state';
      const state = user.id; // Use user ID as state for security

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

      const redirectUri = `${new URL(req.url).origin}/auth/spotify/callback`;

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

      // Store tokens in the database
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
      // Get current playing track with token refresh
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
        .eq('id', user.id)
        .single();

      if (!profile?.spotify_access_token) {
        return new Response(JSON.stringify({ error: 'No Spotify connection' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      let accessToken = profile.spotify_access_token;

      // Check if token needs refresh
      if (profile.spotify_token_expires_at && new Date(profile.spotify_token_expires_at) <= new Date()) {
        const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
        const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

        if (!clientId || !clientSecret || !profile.spotify_refresh_token) {
          throw new Error('Cannot refresh token');
        }

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

          // Update stored tokens
          await supabase
            .from('profiles')
            .update({
              spotify_access_token: newTokens.access_token,
              spotify_token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      }

      // Get currently playing track
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (spotifyResponse.status === 204 || !spotifyResponse.ok) {
        return new Response(JSON.stringify({ isPlaying: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const currentTrack: SpotifyCurrentlyPlaying = await spotifyResponse.json();
      
      if (!currentTrack.is_playing || !currentTrack.item) {
        return new Response(JSON.stringify({ isPlaying: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const track = currentTrack.item;
      const artists = track.artists.map(artist => artist.name).join(', ');
      const albumCover = track.album.images.find(img => img.height >= 300)?.url || track.album.images[0]?.url;

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
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in spotify-auth function:', error);
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
