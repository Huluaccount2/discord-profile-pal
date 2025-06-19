
import { DeskThing } from 'deskthing-server';

const startup = async () => {
  DeskThing.sendLog('Discord Profile Pal: Starting Up');
  
  // Request initial data to ensure connection works
  DeskThing.send({
    type: 'get',
    request: 'data'
  });
  
  DeskThing.sendLog('Discord Profile Pal: App started successfully!');
};

const stop = () => {
  DeskThing.sendLog('Discord Profile Pal: Stopping app');
};

const onMessageFromMain = (event: string, ...args: any[]) => {
  const messageType = event;
  const messageRequest = args[0];
  const data = args[1];
  
  DeskThing.sendLog(`Discord Profile Pal: Received message - Type: ${messageType}, Request: ${messageRequest}`);
  
  switch (messageType) {
    case 'get':
      handleGetRequest(messageRequest, data);
      break;
    case 'set':
      handleSetRequest(messageRequest, data);
      break;
    case 'data':
      handleDataReceived(data);
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown message type: ${messageType}`);
  }
};

const handleGetRequest = (request: string, data: any) => {
  switch (request) {
    case 'discord_profile':
      // Send mock Discord profile data for now
      DeskThing.send({
        type: 'data',
        payload: {
          type: 'profile_data',
          payload: {
            id: '123456789',
            username: 'TestUser',
            avatar: 'avatar_hash',
            discriminator: '0000',
            activities: [
              {
                name: "Spotify",
                type: 2,
                details: "Sample Song",
                state: "by Sample Artist",
                timestamps: {
                  start: Date.now() - 60000,
                  end: Date.now() + 180000
                },
                assets: {
                  large_image: "spotify:ab67616d0000b273...",
                  large_text: "Sample Album"
                }
              }
            ],
            custom_status: {
              text: "Coding with DeskThing! 🚗💻"
            }
          }
        }
      });
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown get request: ${request}`);
  }
};

const handleSetRequest = (request: string, data: any) => {
  switch (request) {
    case 'refresh':
      DeskThing.sendLog('Discord Profile Pal: Refreshing Discord data');
      // Trigger a refresh of Discord data
      handleGetRequest('discord_profile', null);
      break;
    default:
      DeskThing.sendLog(`Discord Profile Pal: Unknown set request: ${request}`);
  }
};

const handleDataReceived = (data: any) => {
  DeskThing.sendLog('Discord Profile Pal: Data received from client:', data);
  // Handle any data sent from the webapp
};

// Export the required functions for DeskThing
export { DeskThing };

// Set up event listeners
DeskThing.on('start', startup);
DeskThing.on('stop', stop);
DeskThing.on('purge', () => {
  DeskThing.sendLog('Discord Profile Pal: App cleaned up successfully');
});

// Handle all messages from main using the new structure
DeskThing.on('get', (data) => onMessageFromMain('get', data.request, data));
DeskThing.on('set', (data) => onMessageFromMain('set', data.request, data));
DeskThing.on('data', (data) => onMessageFromMain('data', data));

// Handle client communication
DeskThing.on('message', (data) => {
  DeskThing.sendLog(`Discord Profile Pal: Message from client: ${JSON.stringify(data)}`);
  
  // Echo back to demonstrate two-way communication
  DeskThing.send({
    type: 'message',
    payload: 'Hello from Discord Profile Pal server!'
  });
});
