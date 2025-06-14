
import { DiscordProfile } from "@/components/DiscordProfile";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <DiscordProfile />
      </div>
    </div>
  );
};

export default Index;
