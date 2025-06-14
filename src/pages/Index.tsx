
import { DiscordProfile } from "@/components/DiscordProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-bold text-white">Welcome to DesktThing</h1>
            <p className="text-gray-400">Sign in to view your Discord profile and status</p>
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
      {/* Car Thing optimized layout - 800x480 */}
      <div className="w-full h-screen max-w-[800px] max-h-[480px] mx-auto flex flex-col overflow-hidden">
        {/* Compact header for Car Thing */}
        <div className="flex justify-between items-center p-2 bg-gray-900/50 backdrop-blur-sm">
          <h1 className="text-sm font-bold text-white">DesktThing</h1>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Sign Out
          </Button>
        </div>
        
        {/* Main content optimized for Car Thing resolution */}
        <div className="flex-1 p-2">
          <DiscordProfile />
        </div>
      </div>
    </div>
  );
};

export default Index;
