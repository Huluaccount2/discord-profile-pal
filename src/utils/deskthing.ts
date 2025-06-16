
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

    // Handle Discord data from server
    DeskThing.on('discord', (data) => {
      console.log('DeskThing: Discord data received', data);
      this.handleDiscordData(data);
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
    DeskThing.send({
      type: 'get',
      request: 'discord_profile',
      payload: {}
    });
  }

  // File system methods for LyricStatusMonitor
  public watchFile(path: string, callback: (event: string, filename: string) => void) {
    console.log('DeskThing: Setting up file watcher for:', path);
    DeskThing.send({
      type: 'file_watch',
      payload: { path }
    });

    // Set up listener for file change events
    DeskThing.on('file_change', (data) => {
      if (data.path === path) {
        callback(data.event, data.filename);
      }
    });
  }

  public unwatchFile(path: string) {
    console.log('DeskThing: Removing file watcher for:', path);
    DeskThing.send({
      type: 'file_unwatch',
      payload: { path }
    });
  }

  public async listDirectory(path: string): Promise<string[]> {
    console.log('DeskThing: Listing directory:', path);
    return new Promise((resolve) => {
      DeskThing.send({
        type: 'list_directory',
        payload: { path }
      });

      const handleResponse = (data: any) => {
        if (data.type === 'directory_list' && data.path === path) {
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
      DeskThing.send({
        type: 'file_stats',
        payload: { path }
      });

      const handleResponse = (data: any) => {
        if (data.type === 'file_stats' && data.path === path) {
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
      DeskThing.send({
        type: 'read_file',
        payload: { path }
      });

      const handleResponse = (data: any) => {
        if (data.type === 'file_content' && data.path === path) {
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
  }

  public sendError(error: Error, context?: string) {
    console.error('DeskThing Error:', error, context);
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
