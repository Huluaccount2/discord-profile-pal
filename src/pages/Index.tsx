import { DiscordProfile } from "@/components/DiscordProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useDeskThing } from "@/contexts/DeskThingContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { NotificationBanner } from "@/components/NotificationBanner";

const Index = () => {
  const { user, loading } = useAuth();
  const { isRunningOnDeskThing, sendLog } = useDeskThing();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  // Replace with user's real data in a real app
  const sampleNotif = {
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    username: "Alice",
    message: "Hey <@you>! Can you check the latest updates?",
    server: "LoFi Chill Zone",
    channel: "#general",
  };

  useEffect(() => {
    if (isRunningOnDeskThing) {
      sendLog('info', 'Discord Profile Pal loaded on DeskThing');
    }
  }, [isRunningOnDeskThing, sendLog]);

  // If running on DeskThing, skip all authentication and show the profile directly
  if (isRunningOnDeskThing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* DeskThing optimized layout - 800x480 full width, no authentication needed */}
        <div className="w-full h-screen max-w-[800px] max-h-[480px] mx-auto flex flex-col overflow-hidden">
          <div className="flex-1">
            <DiscordProfile />
          </div>
        </div>
      </div>
    );
  }

  // Regular web app flow - require authentication for browser users
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
              Sign in to view your Discord profile and status
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
      {/* Add notification banner to top of relevant page */}
      <NotificationBanner
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        avatarUrl={sampleNotif.avatarUrl}
        username={sampleNotif.username}
        message={sampleNotif.message}
        server={sampleNotif.server}
        channel={sampleNotif.channel}
      />
      {/* Test button for UI preview — you may remove this later */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150]">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          onClick={() => setNotifOpen(true)}
        >
          Demo Notification
        </button>
      </div>
      {/* Regular web layout */}
      <div className="w-full h-screen max-w-[800px] max-h-[480px] mx-auto flex flex-col overflow-hidden">
        <div className="flex-1">
          <DiscordProfile />
        </div>
      </div>
    </div>
  );
};

export default Index;
