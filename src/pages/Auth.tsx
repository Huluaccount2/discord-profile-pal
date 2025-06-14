
import React from 'react';
import { Card } from '@/components/ui/card';
import { AuthForm } from './AuthForm';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { useAuthPageLogic } from "./useAuthPageLogic";

const Auth: React.FC = () => {
  const {
    isLogin, email, password, username,
    loading, authError, boundaryError,
    setIsLogin, setAuthError, setEmail, setPassword, setUsername,
    handleEmailAuth, handleDiscordAuth,
  } = useAuthPageLogic();

  if (boundaryError) {
    console.error("[Auth] Error boundary triggered:", boundaryError);
    return <AuthErrorBoundary error={boundaryError} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6">
        <AuthForm
          isLogin={isLogin}
          loading={loading}
          email={email}
          password={password}
          username={username}
          authError={authError}
          onChangeEmail={e => setEmail(e.target.value)}
          onChangePassword={e => setPassword(e.target.value)}
          onChangeUsername={e => setUsername(e.target.value)}
          onSubmit={handleEmailAuth}
          onDiscordAuth={handleDiscordAuth}
          onToggleForm={() => {
            setIsLogin(x => !x);
            setAuthError(null);
          }}
        />
      </Card>
    </div>
  );
};

export default Auth;
