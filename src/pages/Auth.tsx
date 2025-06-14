
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

const Auth = () => {
  // Error boundary state
  const [renderError, setRenderError] = useState<Error | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  // Defensive: wrap useAuth in try/catch in case of provider issues
  let user: any = null;
  try {
    user = useAuth().user;
  } catch (err) {
    setRenderError(
      err instanceof Error ? err : new Error("Unknown Auth context error")
    );
  }
  const navigate = useNavigate();

  // Log top-level render
  useEffect(() => {
    console.log("[Auth Page] Rendered. user:", user);
  }, [user]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check for auth errors from URL params (OAuth callback errors)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.log('Auth callback error:', { error, errorDescription });
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
      
      // Clean up URL
      window.history.replaceState({}, '', '/auth');
    }
  }, [toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isLogin) {
        console.log('Attempting email login...');
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Email login error:', error);
          setAuthError(error.message);
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('Email login successful');
          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });
        }
      } else {
        console.log('Attempting email signup...');
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: username,
            }
          }
        });

        if (error) {
          console.error('Email signup error:', error);
          setAuthError(error.message);
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('Email signup successful');
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation link.",
          });
        }
      }
    } catch (error: any) {
      console.error('Unexpected auth error:', error);
      const errorMessage = error?.message || "An unexpected error occurred.";
      setAuthError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordAuth = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      console.log('Initiating Discord OAuth...');
      console.log('Current origin:', window.location.origin);
      
      const redirectTo = `${window.location.origin}/`;
      console.log('Discord redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Discord OAuth initiation error:', error);
        setAuthError(`Discord authentication failed: ${error.message}`);
        toast({
          title: "Discord Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Discord OAuth initiated successfully');
      }
    } catch (error: any) {
      console.error('Discord auth unexpected error:', error);
      const errorMessage = error?.message || "Failed to initiate Discord login.";
      setAuthError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Error boundary rendering
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-6 bg-red-950 text-red-300 border border-red-700">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <div className="font-bold">A critical error occurred in the authentication page.</div>
            <div className="mt-2">{renderError.message}</div>
            <div className="mt-2 text-xs">Check the console for details.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to view your Discord profile' : 'Join to get started'}
            </p>
          </div>

          {/* Show auth error if present */}
          {authError && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-300">
                <p className="font-medium">Authentication Error</p>
                <p className="mt-1">{authError}</p>
                <p className="mt-2 text-xs text-red-400">
                  If Discord login continues to fail, please try email authentication below or contact support.
                </p>
              </div>
            </div>
          )}

          {/* Discord Login Button */}
          <Button
            onClick={handleDiscordAuth}
            disabled={loading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Discord'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError(null);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Configuration help */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Having trouble with Discord login?</p>
            <p>Check your Supabase Auth URL configuration in the dashboard.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;

