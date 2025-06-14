
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

interface EmptyMusicStateProps {
  isConnected: boolean;
  onConnect: () => void;
}

export const EmptyMusicState: React.FC<EmptyMusicStateProps> = ({
  isConnected,
  onConnect
}) => {
  console.log('EmptyMusicState: Rendering with isConnected:', isConnected);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 p-6 w-full">
      <div className="text-center">
        <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {!isConnected ? (
          <>
            <h3 className="text-white font-semibold text-lg mb-2">
              Connect Spotify
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Connect your Spotify account to see what you're listening to and control playback
            </p>
            <Button 
              onClick={() => {
                console.log('EmptyMusicState: Connect button clicked');
                onConnect();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Connect Spotify
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-white font-semibold text-lg mb-2">
              No music playing
            </h3>
            <p className="text-gray-400 text-sm">
              Start playing music on Spotify to see controls here
            </p>
          </>
        )}
      </div>
    </Card>
  );
};
