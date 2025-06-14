
import { useState, useEffect } from 'react';
import { useDeskThing } from '@/contexts/DeskThingContext';

// Mock user object for DeskThing usage
const DESKTHING_USER = {
  id: 'deskthing-user',
  email: 'deskthing@local.app',
  user_metadata: {
    username: 'DeskThing User'
  }
};

export const useDeskThingAuth = () => {
  const { isRunningOnDeskThing } = useDeskThing();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRunningOnDeskThing) {
      // For DeskThing, we bypass authentication entirely
      // All configuration is handled on the server side
      console.log('useDeskThingAuth: Running on DeskThing, bypassing authentication');
      setUser(DESKTHING_USER);
      setLoading(false);
    } else {
      // For regular web usage, we'll use normal Supabase auth
      setUser(null);
      setLoading(false);
    }
  }, [isRunningOnDeskThing]);

  return {
    user,
    loading,
    // For DeskThing, these are no-ops since auth is handled server-side
    signOut: async () => {
      if (isRunningOnDeskThing) {
        console.log('useDeskThingAuth: Sign out not applicable for DeskThing');
        return;
      }
    }
  };
};
