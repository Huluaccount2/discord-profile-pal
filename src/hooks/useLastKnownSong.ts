
import { useState, useEffect } from "react";

// This hook manages reading and writing the last known song to localStorage,
// Exposes [lastKnownSong, setLastKnownSong]
export function useLastKnownSong() {
  const [lastKnownSong, setLastKnownSongState] = useState<any>(null);

  // Load once on mount
  useEffect(() => {
    try {
      const savedSong = window.localStorage.getItem("discordpal:lastKnownSong");
      if (savedSong) {
        setLastKnownSongState(JSON.parse(savedSong));
      }
    } catch (e) {
      console.warn("Unable to load last known song from localStorage", e);
    }
  }, []);

  // Whenever lastKnownSong is set, persist to storage
  const setLastKnownSong = (song: any) => {
    setLastKnownSongState(song);
    try {
      window.localStorage.setItem("discordpal:lastKnownSong", JSON.stringify(song));
    } catch (e) {
      console.warn("Unable to save last known song to localStorage", e);
    }
  };

  return [lastKnownSong, setLastKnownSong] as const;
}
