
import { DeskThing } from 'deskthing-server';
export { DeskThing };

const startup = () => {
  DeskThing.sendLog('Discord Profile Pal: Starting Up');
  
  // Initialize Discord integration here if needed
  // For now, we'll focus on the basic DeskThing structure
};

const stop = () => {
  DeskThing.sendLog('Discord Profile Pal: Stopping app');
};

// All main logic should be in the startup function
DeskThing.on('start', startup);

DeskThing.on('stop', stop);

DeskThing.on('purge', () => {
  DeskThing.sendLog('Discord Profile Pal: App cleaned up successfully');
});

// Handle client messages - updated for 0.11.12
DeskThing.on('data', (data) => {
  DeskThing.sendLog(`Received data request: ${data.request || data.type}`);
  
  if (data.request === 'discord_profile' || data.type === 'get') {
    // For now, send mock data until we implement the actual Discord integration
    DeskThing.sendDataToClient({
      type: 'discord',
      payload: {
        type: 'profile_data',
        payload: {
          id: '123456789',
          username: 'TestUser',
          avatar: 'avatar_hash',
          discriminator: '0000',
          activities: [],
          custom_status: null
        }
      }
    });
  }
});

// Legacy support for older message types
DeskThing.on('get', (data) => {
  DeskThing.sendLog(`Received get request: ${data.request}`);
  
  if (data.request === 'discord_profile') {
    DeskThing.sendDataToClient({
      type: 'discord',
      payload: {
        type: 'profile_data',
        payload: {
          id: '123456789',
          username: 'TestUser',
          avatar: 'avatar_hash',
          discriminator: '0000',
          activities: [],
          custom_status: null
        }
      }
    });
  }
});

DeskThing.on('set', (data) => {
  DeskThing.sendLog(`Received set request: ${data.request}`);
  // Handle set requests here
});
