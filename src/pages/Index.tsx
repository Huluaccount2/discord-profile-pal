
import { DiscordProfile } from "@/components/DiscordProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useDeskThing } from "@/contexts/DeskThingContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const { isRunningOnDeskThing, sendLog } = useDeskThing();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRunningOnDeskThing) {
      sendLog('info', 'Discord Profile Pal loaded on DeskThing', { userId: user?.id });
    }
  }, [user, isRunningOnDeskThing, sendLog]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border-gray-700/50 p-6 text-center">
          <div className="space-y-4">
            <User className="h-16 w-16 text-blue-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Welcome</h1>
            <p className="text-gray-400">
              {isRunningOnDeskThing ? 
                "Sign in to view your Discord profile on your Car Thing" : 
                "Sign in to view your Discord profile and status"
              }
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In / Sign Up
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Car Thing optimized layout - 800x480 full width */}
      <div className="w-full h-screen max-w-[800px] max-h-[480px] mx-auto flex flex-col overflow-hidden">
        {/* Main content optimized for Car Thing resolution - no padding */}
        <div className="flex-1">
          <DiscordProfile />
        </div>
      </div>
    </div>
  );
};

export default Index;
