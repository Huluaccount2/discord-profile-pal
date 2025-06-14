
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('SpotifyCallback: Current URL:', window.location.href);
      console.log('SpotifyCallback: Search params:', window.location.search);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      console.log('SpotifyCallback: Extracted params:', { code: code?.substring(0, 10) + '...', state, error });

      if (error) {
        console.error('SpotifyCallback: Spotify authorization error:', error);
        navigate('/', { replace: true });
        return;
      }

      if (!code || !state) {
        console.error('SpotifyCallback: Missing code or state parameter');
        console.log('SpotifyCallback: Available URL params:', Array.from(urlParams.entries()));
        navigate('/', { replace: true });
        return;
      }

      try {
        console.log('SpotifyCallback: Attempting to exchange code for tokens');
        const session = await supabase.auth.getSession();
        console.log('SpotifyCallback: Current session:', session.data.session ? 'exists' : 'none');

        if (!session.data.session) {
          console.error('SpotifyCallback: No authenticated session found');
          navigate('/auth', { replace: true });
          return;
        }

        const { data, error: exchangeError } = await supabase.functions.invoke('spotify-auth', {
          body: { 
            action: 'exchange-code',
            code,
            state
          },
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        });

        if (exchangeError) {
          console.error('SpotifyCallback: Error exchanging code for tokens:', exchangeError);
        } else {
          console.log('SpotifyCallback: Spotify tokens exchanged successfully');
        }
      } catch (error) {
        console.error('SpotifyCallback: Error during token exchange:', error);
      }

      // Always redirect back to home page
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 text-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p>Connecting to Spotify...</p>
        </div>
      </Card>
    </div>
  );
};

export default SpotifyCallback;
