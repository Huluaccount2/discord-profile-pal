
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  isLogin: boolean;
  loading: boolean;
  email: string;
  password: string;
  username: string;
  authError: string | null;
  onChangeEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangePassword: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeUsername: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDiscordAuth: () => void;
  onToggleForm: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isLogin,
  loading,
  email,
  password,
  username,
  authError,
  onChangeEmail,
  onChangePassword,
  onChangeUsername,
  onSubmit,
  onDiscordAuth,
  onToggleForm,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-gray-400">
          {isLogin ? 'Sign in to view your Discord profile' : 'Join to get started'}
        </p>
      </div>

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
        onClick={onDiscordAuth}
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
      <form onSubmit={onSubmit} className="space-y-4">
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
                onChange={onChangeUsername}
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
              onChange={onChangeEmail}
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
              onChange={onChangePassword}
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
          onClick={onToggleForm}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Having trouble with Discord login?</p>
        <p>Check your Supabase Auth URL configuration in the dashboard.</p>
      </div>
    </div>
  );
};
