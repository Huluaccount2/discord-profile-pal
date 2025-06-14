
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

// Mock user for DeskThing
const DESKTHING_USER = {
  id: 'deskthing-user',
  email: 'deskthing@local.app',
  user_metadata: {
    username: 'DeskThing User'
  }
} as User;

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
      // For DeskThing, we bypass Supabase auth entirely
      setUser(DESKTHING_USER);
      setSession(null); // DeskThing doesn't need sessions
      setLoading(false);
      return;
    }

    console.log('AuthProvider: Setting up Supabase auth state listener');
    
    // Set up auth state listener for regular web usage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id ? 'user logged in' : 'no user');
        
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
        console.error('Error getting initial session:', error);
      } else {
        console.log('Initial session:', session?.user?.id ? 'user found' : 'no user');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
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
