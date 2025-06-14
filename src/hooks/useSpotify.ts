
import { useSpotifyAuth } from "./spotify/useSpotifyAuth";
import { useSpotifyData } from "./spotify/useSpotifyData";
import { useSpotifyControls } from "./spotify/useSpotifyControls";
import { useSpotifyPolling } from "./spotify/useSpotifyPolling";

export const useSpotify = (userId: string | undefined) => {
  console.log('useSpotify: Hook initialized with userId:', userId);

  const { loading, connectSpotify } = useSpotifyAuth(userId);
  const { spotifyData, isConnected, fetchCurrentTrack } = useSpotifyData(userId);
  const { play, pause, nextTrack, previousTrack } = useSpotifyControls(userId, isConnected, fetchCurrentTrack);
  
  useSpotifyPolling(userId, isConnected, fetchCurrentTrack);

  return {
    spotifyData,
    loading,
    isConnected,
    connectSpotify,
    fetchCurrentTrack,
    play,
    pause,
    nextTrack,
    previousTrack,
  };
};
