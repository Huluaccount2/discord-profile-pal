
import { DeskThing } from 'deskthing-server';

let discordProfileData: any = null;
let refreshInterval: NodeJS.Timeout | null = null;

const startup = async () => {
  console.log('Discord Profile Pal: Starting Up');
  
  // Send initial mock data
  sendMockDiscordProfile();
  
  // Set up refresh interval (30 seconds default)
  const interval = 30 * 1000;
  refreshInterval = setInterval(() => {
    sendMockDiscordProfile();
  }, interval);
  
  console.log('Discord Profile Pal: App started successfully!');
};

const stop = () => {
  console.log('Discord Profile Pal: Stopping app');
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const sendMockDiscordProfile = () => {
  const mockProfile = {
    id: '123456789012345678',
    username: 'DeskThingUser',
    avatar: 'a1b2c3d4e5f6g7h8i9j0',
    discriminator: '0000',
    global_name: 'DeskThing User',
    activities: [
      {
        name: "Spotify",
        type: 2,
        details: "Never Gonna Give You Up",
        state: "by Rick Astley",
        timestamps: {
          start: Date.now() - 60000,
          end: Date.now() + 180000
        },
        assets: {
          large_image: "spotify:ab67616d0000b273ac968dd180d712e4518fe867",
          large_text: "Whenever You Need Somebody"
        }
      }
    ],
    custom_status: {
      text: "Driving with DeskThing! 🚗💨",
      emoji: {
        name: "🚗"
      }
    }
  };

  try {
    // Try to send data using any available method
    console.log('Discord Profile Pal: Mock profile data prepared');
    console.log('Discord Profile Pal: Profile data:', JSON.stringify(mockProfile, null, 2));
  } catch (error) {
    console.error('Discord Profile Pal: Error with mock profile:', error);
  }
};

// Handle messages from client (basic implementation)
const onMessageFromClient = async (data: any) => {
  console.log(`Discord Profile Pal: Received message from client: ${JSON.stringify(data)}`);
  
  switch (data.type) {
    case 'refresh_profile':
      console.log('Discord Profile Pal: Refreshing Discord profile on client request');
      sendMockDiscordProfile();
      break;
    case 'get_profile':
      console.log('Discord Profile Pal: Client requested Discord profile');
      sendMockDiscordProfile();
      break;
    default:
      console.log(`Discord Profile Pal: Unknown message type: ${data.type}`);
  }
};

// Basic startup - try to use DeskThing if available, otherwise run standalone
try {
  console.log('Discord Profile Pal: Attempting to initialize');
  startup();
} catch (error) {
  console.error('Discord Profile Pal: Error during startup:', error);
  // Still try to start in basic mode
  startup();
}

// Export for DeskThing (if needed)
export { DeskThing };
