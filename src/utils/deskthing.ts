import { DeskThing as DT } from 'deskthing-client';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;
  private isConnected = false;
  private discordDataCallbacks = new Set<(data: any) => void>();
  private deskThing: any;

  private constructor() {
    // Initialize DeskThing instance
    this.deskThing = DT;
    this.setupEventListeners();
  }

  public static getInstance(): DeskThingIntegration {
    if (!DeskThingIntegration.instance) {
      DeskThingIntegration.instance = new DeskThingIntegration();
    }
    return DeskThingIntegration.instance;
  }

  private setupEventListeners() {
    // Use direct message handling instead of event listeners
    console.log('DeskThing: Setting up integration');
    
    // Listen for messages from the parent window (DeskThing)
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'DESKTHING_MESSAGE') {
          this.handleMessage(event.data.payload);
        }
      });
    }

    this.isConnected = true;
  }

  private handleMessage(data: any) {
    console.log('DeskThing: Message received:', data);
    
    switch (data.type) {
      case 'start':
        console.log('DeskThing: App has started successfully!');
        this.isConnected = true;
        this.requestDiscordProfile();
        break;
      case 'stop':
        console.log('DeskThing: App has stopped');
        this.isConnected = false;
        break;
      case 'purge':
        console.log('DeskThing: App is cleaned up');
        this.cleanup();
        break;
      case 'profile_data':
        this.handleDiscordData(data.payload);
        break;
      case 'file_change':
        // Handle file change events
        break;
    }
  }

  private handleDiscordData(data: any) {
    this.discordDataCallbacks.forEach(callback => callback({
      type: 'profile_data',
      payload: data
    }));
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
    
    // Store callback for file events
    const handleFileEvent = (data: any) => {
      if (data && data.path === path) {
        callback(data.event || 'change', data.filename || '');
      }
    };
    
    // Add to callbacks (simplified implementation)
    this.discordDataCallbacks.add(handleFileEvent);
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
          resolve(data.files || []);
        }
      };

      // Add temporary callback
      this.discordDataCallbacks.add(handleResponse);
      
      // Clean up after timeout
      setTimeout(() => {
        this.discordDataCallbacks.delete(handleResponse);
        resolve([]);
      }, 5000);
    });
  }

  public async getFileStats(path: string): Promise<{ modified: number }> {
    console.log('DeskThing: Getting file stats for:', path);
    return new Promise((resolve) => {
      this.sendMessageToServer('get', 'file_stats', { path });

      const handleResponse = (data: any) => {
        if (data && data.type === 'file_stats' && data.path === path) {
          resolve({ modified: data.modified || Date.now() });
        }
      };

      // Add temporary callback
      this.discordDataCallbacks.add(handleResponse);
      
      // Clean up after timeout
      setTimeout(() => {
        this.discordDataCallbacks.delete(handleResponse);
        resolve({ modified: Date.now() });
      }, 5000);
    });
  }

  public async readFile(path: string): Promise<string> {
    console.log('DeskThing: Reading file:', path);
    return new Promise((resolve, reject) => {
      this.sendMessageToServer('get', 'read_file', { path });

      const handleResponse = (data: any) => {
        if (data && data.type === 'file_content' && data.path === path) {
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.content || '');
          }
        }
      };

      // Add temporary callback
      this.discordDataCallbacks.add(handleResponse);
      
      // Clean up after timeout
      setTimeout(() => {
        this.discordDataCallbacks.delete(handleResponse);
        reject(new Error('Timeout'));
      }, 5000);
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
