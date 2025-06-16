import { DeskThing } from 'deskthing-client';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;
  private deskThing: typeof DeskThing;
  private isConnected = false;
  private fileWatchers = new Map<string, (event: string, filename: string) => void>();

  private constructor() {
    // Initialize DeskThing - it's a static object
    this.deskThing = DeskThing;
    this.setupEventListeners();
  }

  public static getInstance(): DeskThingIntegration {
    if (!DeskThingIntegration.instance) {
      DeskThingIntegration.instance = new DeskThingIntegration();
    }
    return DeskThingIntegration.instance;
  }

  private setupEventListeners() {
    // Essential DeskThing lifecycle events
    this.deskThing.on('start', () => {
      console.log('DeskThing: App has started successfully!');
      this.isConnected = true;
    });

    this.deskThing.on('stop', () => {
      console.log('DeskThing: Sample app has stopped successfully');
      this.isConnected = false;
    });

    this.deskThing.on('purge', () => {
      console.log('DeskThing: Sample app is cleaned up successfully');
      this.cleanup();
    });

    // Handle settings updates from DeskThing
    this.deskThing.on('settings', (settings: any) => {
      console.log('DeskThing: Settings updated', settings);
      this.handleSettingsUpdate(settings);
    });

    // Handle data requests from DeskThing server
    this.deskThing.on('get', (request: any) => {
      console.log('DeskThing: Data requested', request);
      this.handleDataRequest(request);
    });

    // Handle file system events
    this.deskThing.on('fs-change', (data: any) => {
      console.log('DeskThing: File system change detected', data);
      this.handleFileSystemChange(data);
    });

    // Handle file system responses
    this.deskThing.on('fs-response', (data: any) => {
      console.log('DeskThing: File system response', data);
      this.handleFileSystemResponse(data);
    });

    // Handle incoming data from server
    this.deskThing.on('sampleType', (data: any) => {
      console.log(data.payload); // prints 'Hello from the server!'
    });
  }

  private handleFileSystemChange(data: any) {
    const { path, event, filename } = data;
    const callback = this.fileWatchers.get(path);
    if (callback) {
      callback(event, filename);
    }
  }

  private handleFileSystemResponse(data: any) {
    // Handle responses from file system operations
    // This would be used for resolving promises in file operations
  }

  // File System Operations
  public async readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.deskThing.send({
          type: 'fs-read',
          payload: { path }
        });
        
        // Set up temporary listener for response
        const responseHandler = (data: any) => {
          if (data.path === path) {
            this.deskThing.off('fs-read-response', responseHandler);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.content);
            }
          }
        };
        
        this.deskThing.on('fs-read-response', responseHandler);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          this.deskThing.off('fs-read-response', responseHandler);
          reject(new Error('File read timeout'));
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  public async listDirectory(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        this.deskThing.send({
          type: 'fs-list',
          payload: { path }
        });
        
        const responseHandler = (data: any) => {
          if (data.path === path) {
            this.deskThing.off('fs-list-response', responseHandler);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.files || []);
            }
          }
        };
        
        this.deskThing.on('fs-list-response', responseHandler);
        
        setTimeout(() => {
          this.deskThing.off('fs-list-response', responseHandler);
          reject(new Error('Directory list timeout'));
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  public watchFile(path: string, callback: (event: string, filename: string) => void): void {
    this.fileWatchers.set(path, callback);
    
    this.deskThing.send({
      type: 'fs-watch',
      payload: { path }
    });
  }

  public unwatchFile(path: string): void {
    this.fileWatchers.delete(path);
    
    this.deskThing.send({
      type: 'fs-unwatch',
      payload: { path }
    });
  }

  public async getFileStats(path: string): Promise<{ modified: number; size: number }> {
    return new Promise((resolve, reject) => {
      try {
        this.deskThing.send({
          type: 'fs-stats',
          payload: { path }
        });
        
        const responseHandler = (data: any) => {
          if (data.path === path) {
            this.deskThing.off('fs-stats-response', responseHandler);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve({
                modified: data.modified || 0,
                size: data.size || 0
              });
            }
          }
        };
        
        this.deskThing.on('fs-stats-response', responseHandler);
        
        setTimeout(() => {
          this.deskThing.off('fs-stats-response', responseHandler);
          reject(new Error('File stats timeout'));
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private cleanup() {
    // Clean up any resources, intervals, etc.
    this.isConnected = false;
    this.fileWatchers.clear();
  }

  private handleSettingsUpdate(settings: any) {
    // Handle settings updates from DeskThing
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    
    if (settings.refresh_interval) {
      // Update polling intervals based on DeskThing settings
      console.log('DeskThing: Refresh interval updated to', settings.refresh_interval);
    }
  }

  private handleDataRequest(request: any) {
    // Handle data requests from DeskThing server
    switch (request.type) {
      case 'discord-profile':
        this.sendDiscordProfile();
        break;
      case 'spotify-status':
        this.sendSpotifyStatus();
        break;
      default:
        console.log('DeskThing: Unknown data request type', request.type);
    }
  }

  private async sendDiscordProfile() {
    try {
      const profileData = await this.getCurrentProfileData();
      // Send data to DeskThing server
      this.deskThing.send({ 
        type: 'sampleType', 
        payload: 'Hello from the client!' 
      });
    } catch (error) {
      console.error('DeskThing: Error sending Discord profile', error);
    }
  }

  private async sendSpotifyStatus() {
    try {
      const spotifyData = await this.getCurrentSpotifyData();
      this.deskThing.send({
        type: 'spotify-status',
        payload: spotifyData
      });
    } catch (error) {
      console.error('DeskThing: Error sending Spotify status', error);
    }
  }

  private async getCurrentProfileData() {
    // This would integrate with your existing profile hooks
    return {
      username: 'User',
      status: 'online',
      avatar: null
    };
  }

  private async getCurrentSpotifyData() {
    // This would integrate with your existing Spotify hooks
    return {
      isPlaying: false,
      track: null
    };
  }

  // Client-side methods for sending data to server
  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    try {
      this.deskThing.send({
        type: 'log',
        payload: {
          level,
          message,
          data: data ? JSON.stringify(data) : undefined
        }
      });
    } catch (error) {
      console.log(`DeskThing Log [${level}]: ${message}`, data);
    }
  }

  public sendError(error: Error, context?: string) {
    try {
      this.deskThing.send({
        type: 'error',
        payload: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          context
        }
      });
    } catch (err) {
      console.error('DeskThing Error:', error, context);
    }
  }

  public updateSettings(settings: Record<string, any>) {
    try {
      this.deskThing.send({
        type: 'settings',
        payload: settings
      });
    } catch (error) {
      console.log('DeskThing: Settings update requested', settings);
    }
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
      console.log('DeskThing: Initializing DeskThing integration');
      try {
        // DeskThing auto-initializes when imported, no need to call start()
        this.sendLog('info', 'Discord Profile Pal started successfully');
      } catch (error) {
        console.error('DeskThing: Failed to initialize', error);
        this.sendError(error as Error, 'initialization');
      }
    } else {
      console.log('DeskThing: Running in standalone mode');
    }
  }
}

export const deskthingIntegration = DeskThingIntegration.getInstance();
