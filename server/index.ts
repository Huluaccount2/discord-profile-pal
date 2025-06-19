
import { DeskThing } from 'deskthing-server';

let discordProfileData: any = null;
let refreshInterval: NodeJS.Timeout | null = null;

const startup = async () => {
  DeskThing.sendLog('Discord Profile Pal: Starting Up');
  
  // Add settings for Discord Profile Pal
  DeskThing.addSettings({
    discord_user_id: {
      type: 'string',
      label: 'Discord User ID',
      value: '',
      description: 'Your Discord User ID for profile fetching'
    },
    refresh_interval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      value: 30,
      description: 'How often to refresh Discord profile data'
    },
    show_spotify: {
      type: 'boolean',
      label: 'Show Spotify Activity',
      value: true,
      description: 'Display Spotify listening activity from Discord'
    }
  });

  // Get initial settings
  const settings = await DeskThing.getSettings();
  DeskThing.sendLog(`Discord Profile Pal: Settings loaded - Refresh interval: ${settings?.refresh_interval?.value || 30}s`);

  // Send initial mock data
  sendMockDiscordProfile();
  
  // Set up refresh interval
  const interval = (settings?.refresh_interval?.value || 30) * 1000;
  refreshInterval = setInterval(() => {
    sendMockDiscordProfile();
  }, interval);
  
  DeskThing.sendLog('Discord Profile Pal: App started successfully!');
};

const stop = () => {
  DeskThing.sendLog('Discord Profile Pal: Stopping app');
  
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

  DeskThing.send({
    type: 'discord_profile',
    payload: mockProfile
  });

  DeskThing.sendLog('Discord Profile Pal: Sent Discord profile data to client');
};

// Handle messages from client
const onMessageFromClient = async (data: any) => {
  DeskThing.sendLog(`Discord Profile Pal: Received message from client: ${JSON.stringify(data)}`);
  
  switch (data.type) {
    case 'refresh_profile':
      DeskThing.sendLog('Discord Profile Pal: Refreshing Discord profile on client request');
      sendMockDiscordProfile();
      break;
    case 'get_profile':
      DeskThing.sendLog('Discord Profile Pal: Client requested Discord profile');
      sendMockDiscordProfile();
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown message type: ${data.type}`);
  }
};

// Handle settings changes
const onSettingsChanged = async (settings: any) => {
  DeskThing.sendLog('Discord Profile Pal: Settings changed:', settings);
  
  // Update refresh interval if changed
  if (settings.refresh_interval && refreshInterval) {
    clearInterval(refreshInterval);
    const interval = settings.refresh_interval.value * 1000;
    refreshInterval = setInterval(() => {
      sendMockDiscordProfile();
    }, interval);
    DeskThing.sendLog(`Discord Profile Pal: Updated refresh interval to ${settings.refresh_interval.value}s`);
  }
};

// Register action for manual refresh
DeskThing.registerAction('Refresh Discord Profile', 'refresh_discord', 'Manually refresh Discord profile data');

// Handle action triggers
const onActionTriggered = (action: string) => {
  switch (action) {
    case 'refresh_discord':
      DeskThing.sendLog('Discord Profile Pal: Manual refresh triggered');
      sendMockDiscordProfile();
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown action: ${action}`);
  }
};

// Set up event listeners
const startListener = DeskThing.on('start', startup);
const stopListener = DeskThing.on('stop', stop);

DeskThing.on('purge', () => {
  DeskThing.sendLog('Discord Profile Pal: App cleaned up successfully');
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Handle client messages
DeskThing.on('message', onMessageFromClient);

// Handle settings changes
DeskThing.on('settings', onSettingsChanged);

// Handle action triggers
DeskThing.on('action', onActionTriggered);

// Handle get requests from client
DeskThing.on('get', async (data) => {
  switch (data.request) {
    case 'discord_profile':
      sendMockDiscordProfile();
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown get request: ${data.request}`);
  }
});

// Export for DeskThing
export { DeskThing };
