
import { useSpotifyAuth } from "./spotify/useSpotifyAuth";
import { useSpotifyData } from "./spotify/useSpotifyData";
import { useSpotifyControls } from "./spotify/useSpotifyControls";
import { useSpotifyPolling } from "./spotify/useSpotifyPolling";
import { useDeskThing } from "@/contexts/DeskThingContext";

export const useSpotify = (userId: string | undefined) => {
  console.log('useSpotify: Hook initialized with userId:', userId);
  const { isRunningOnDeskThing } = useDeskThing();

  const { loading, connectSpotify } = useSpotifyAuth(userId);
  const { spotifyData, isConnected, connectionError, fetchCurrentTrack, isInitialized } = useSpotifyData(userId);
  const { play, pause, nextTrack, previousTrack } = useSpotifyControls(userId, isConnected, fetchCurrentTrack);
  
  // Only enable polling for web usage, not DeskThing
  useSpotifyPolling(isRunningOnDeskThing ? undefined : userId, isConnected && isInitialized, fetchCurrentTrack);

  return {
    spotifyData,
    loading,
    isConnected: isRunningOnDeskThing ? false : isConnected,
    connectionError: isRunningOnDeskThing ? null : connectionError,
    connectSpotify,
    fetchCurrentTrack,
    play,
    pause,
    nextTrack,
    previousTrack,
    isInitialized,
  };
};
