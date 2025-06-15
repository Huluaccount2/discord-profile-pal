
// This file demonstrates the server-side structure for DeskThing
// Note: This would typically be in a separate Node.js environment
// but included here for reference and potential future server integration

import { DeskThing } from 'deskthing-server';

const startup = () => {
  DeskThing.sendLog('Starting Up');
};

const stop = () => {
  DeskThing.sendLog('Stopping app');
};

// Server-side event handlers
DeskThing.on('start', startup);
DeskThing.on('stop', stop);

// Handle client messages on server side
DeskThing.on('sampleType', (data) => {
  console.log(data.payload); // prints 'Hello from the client!'
});

// Send data to client from server
const sendToClient = () => {
  DeskThing.send({ 
    type: 'sampleType', 
    payload: 'Hello from the server!' 
  });
};

// Export for potential server integration
export const deskthingServer = {
  startup,
  stop,
  sendToClient
};
