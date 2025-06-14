
import React from 'react';
import { Card } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

interface AuthErrorBoundaryProps {
  error: Error;
}

export const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-md p-6 bg-red-950 text-red-300 border border-red-700">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <div className="font-bold">A critical error occurred in the authentication page.</div>
        <div className="mt-2">{error.message}</div>
        <div className="mt-2 text-xs">Check the console for details.</div>
      </div>
    </Card>
  </div>
);
