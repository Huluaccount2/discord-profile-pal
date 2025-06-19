import { DeskThing } from 'deskthing-client';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;
  private isConnected = false;
  private discordDataCallbacks = new Set<(data: any) => void>();

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): DeskThingIntegration {
    if (!DeskThingIntegration.instance) {
      DeskThingIntegration.instance = new DeskThingIntegration();
    }
    return DeskThingIntegration.instance;
  }

  private setupEventListeners() {
    DeskThing.on('start', () => {
      console.log('DeskThing: App has started successfully!');
      this.isConnected = true;
      this.requestDiscordProfile();
    });

    DeskThing.on('stop', () => {
      console.log('DeskThing: App has stopped');
      this.isConnected = false;
    });

    DeskThing.on('purge', () => {
      console.log('DeskThing: App is cleaned up');
      this.cleanup();
    });

    // Handle data from server using the new message structure
    DeskThing.on('data', (data) => {
      console.log('DeskThing: Data received from server', data);
      if (data.type === 'profile_data') {
        this.handleDiscordData(data.payload);
      }
    });

    // Handle direct messages from server
    DeskThing.on('message', (data) => {
      console.log('DeskThing: Message from server:', data);
    });
  }

  private handleDiscordData(data: any) {
    this.discordDataCallbacks.forEach(callback => callback(data));
  }

  public onDiscordData(callback: (data: any) => void) {
    this.discordDataCallbacks.add(callback);
    return () => this.discordDataCallbacks.delete(callback);
  }

  public requestDiscordProfile() {
    console.log('DeskThing: Requesting Discord profile');
    this.sendMessageToServer('get', 'discord_profile');
  }

  public refreshDiscordData() {
    console.log('DeskThing: Refreshing Discord data');
    this.sendMessageToServer('set', 'refresh');
  }

  // Use the proper message structure from the forum
  public sendMessageToServer(type: string, request?: string, data?: any) {
    const payload = {
      app: 'discord-profile-pal',
      type: type,
      request: request || null,
      data: data || null
    };

    // Use the proper postMessage structure from the forum
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        { type: 'IFRAME_ACTION', payload: payload },
        '*'
      );
    }
  }

  // File system methods for LyricStatusMonitor (keeping existing functionality)
  public watchFile(path: string, callback: (event: string, filename: string) => void) {
    console.log('DeskThing: Setting up file watcher for:', path);
    this.sendMessageToServer('get', 'file_watch', { path });
    
    DeskThing.on('file_change', (data: any) => {
      if (data && data.path === path) {
        callback(data.event || 'change', data.filename || '');
      }
    });
  }

  public unwatchFile(path: string) {
    console.log('DeskThing: Removing file watcher for:', path);
    this.sendMessageToServer('set', 'file_unwatch', { path });
  }

  public async listDirectory(path: string): Promise<string[]> {
    console.log('DeskThing: Listing directory:', path);
    return new Promise((resolve) => {
      this.sendMessageToServer('get', 'list_directory', { path });

      const handleResponse = (data: any) => {
        if (data && data.type === 'directory_list' && data.path === path) {
          DeskThing.off('file_response', handleResponse);
          resolve(data.files || []);
        }
      };

      DeskThing.on('file_response', handleResponse);
    });
  }

  public async getFileStats(path: string): Promise<{ modified: number }> {
    console.log('DeskThing: Getting file stats for:', path);
    return new Promise((resolve) => {
      this.sendMessageToServer('get', 'file_stats', { path });

      const handleResponse = (data: any) => {
        if (data && data.type === 'file_stats' && data.path === path) {
          DeskThing.off('file_response', handleResponse);
          resolve({ modified: data.modified || Date.now() });
        }
      };

      DeskThing.on('file_response', handleResponse);
    });
  }

  public async readFile(path: string): Promise<string> {
    console.log('DeskThing: Reading file:', path);
    return new Promise((resolve, reject) => {
      this.sendMessageToServer('get', 'read_file', { path });

      const handleResponse = (data: any) => {
        if (data && data.type === 'file_content' && data.path === path) {
          DeskThing.off('file_response', handleResponse);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.content || '');
          }
        }
      };

      DeskThing.on('file_response', handleResponse);
    });
  }

  private cleanup() {
    this.isConnected = false;
    this.discordDataCallbacks.clear();
  }

  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    console.log(`DeskThing Log [${level}]: ${message}`, data);
    this.sendMessageToServer('log', level, { message, data });
  }

  public sendError(error: Error, context?: string) {
    console.error('DeskThing Error:', error, context);
    this.sendMessageToServer('error', 'client_error', { error: error.message, context });
  }

  public isRunningOnDeskThing(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).DeskThing !== 'undefined';
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async initialize() {
    if (this.isRunningOnDeskThing()) {
      console.log('DeskThing: Initializing Discord Profile Pal integration');
      this.sendLog('info', 'Discord Profile Pal started successfully');
    } else {
      console.log('DeskThing: Running in standalone mode');
    }
  }
}

export const deskthingIntegration = DeskThingIntegration.getInstance();
