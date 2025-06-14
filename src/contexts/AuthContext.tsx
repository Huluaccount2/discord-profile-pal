import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useDeskThing } from '@/contexts/DeskThingContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user for DeskThing - properly typed to match Supabase User interface
const DESKTHING_USER: User = {
  id: 'deskthing-user',
  email: 'deskthing@local.app',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    username: 'DeskThing User'
  },
  identities: []
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // We can't use useDeskThing hook here due to context dependency order
  // So we'll check for DeskThing environment directly
  const isRunningOnDeskThing = typeof window !== 'undefined' && 
                               typeof (window as any).DeskThing !== 'undefined';

  useEffect(() => {
    if (isRunningOnDeskThing) {
      console.log('AuthProvider: Running on DeskThing, using mock authentication');
      setUser(DESKTHING_USER);
      setSession(null);
      setLoading(false);
      return;
    }

    console.log('AuthProvider: Setting up Supabase auth state listener');
    
    // Set up auth state listener for regular web usage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthProvider] onAuthStateChange event:', event, 'session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
        } else if (event === 'USER_UPDATED') {
          console.log('User data updated');
        }
      }
    );

    // Get initial session
    console.log('AuthProvider: Getting initial session');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error getting initial session:', error);
      } else {
        console.log('[AuthProvider] Initial session:', !!session);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('[AuthProvider] Unhandled getSession error:', err);
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [isRunningOnDeskThing]);

  const signOut = async () => {
    if (isRunningOnDeskThing) {
      console.log('AuthProvider: Sign out not applicable for DeskThing');
      return;
    }

    try {
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
