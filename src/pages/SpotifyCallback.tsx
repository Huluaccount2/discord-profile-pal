
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('Spotify authorization error:', error);
        navigate('/', { replace: true });
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        navigate('/', { replace: true });
        return;
      }

      try {
        // Exchange the authorization code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('spotify-auth', {
          body: { 
            action: 'exchange-code',
            code,
            state
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (exchangeError) {
          console.error('Error exchanging code for tokens:', exchangeError);
        } else {
          console.log('Spotify tokens exchanged successfully');
        }
      } catch (error) {
        console.error('Error during token exchange:', error);
      }

      // Redirect back to home page
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
