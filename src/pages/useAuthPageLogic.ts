
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function useAuthPageLogic() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<Error | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  let user: any = null;
  try {
    user = useAuth().user;
  } catch (err) {
    setBoundaryError(err instanceof Error ? err : new Error("Unknown Auth context error"));
  }

  // Logging and debugging
  useEffect(() => {
    console.log("[useAuthPageLogic] user:", user, "isLogin:", isLogin);
  }, [user, isLogin]);

  // Redirect logged-in users away from auth page
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check for errors on OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    if (error) {
      let errorMessage = 'Authentication failed';
      if (error === 'access_denied') {
        errorMessage = 'Discord authentication was cancelled or denied';
      } else if (error === 'server_error') {
        errorMessage = 'Discord server error. Please try again.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }
      setAuthError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/auth'); // Clean up URL
    }
  }, [toast]);

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setAuthError(error.message);
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username,
            },
          }
        });
        if (error) {
          setAuthError(error.message);
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation link.",
          });
        }
      }
    } catch (error: any) {
      setAuthError(error?.message || "An unexpected error occurred.");
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isLogin, email, password, username, toast]);

  const handleDiscordAuth = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setAuthError(`Discord authentication failed: ${error.message}`);
        toast({
          title: "Discord Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setAuthError(error?.message || "Failed to initiate Discord login.");
      toast({
        title: "Error",
        description: error?.message || "Failed to initiate Discord login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    isLogin,
    email,
    password,
    username,
    loading,
    authError,
    boundaryError,
    setIsLogin,
    setAuthError,
    setEmail,
    setPassword,
    setUsername,
    handleEmailAuth,
    handleDiscordAuth,
  };
}
