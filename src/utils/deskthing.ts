import { DeskThing as DT } from 'deskthing-client';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;
  private isConnected = false;
  private discordDataCallbacks = new Set<(data: any) => void>();
  private deskThing: any;
  private listeners = new Map<string, () => void>();

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
    console.log('DeskThing: Setting up integration with proper API');
    
    // Listen for app lifecycle events
    const startListener = this.deskThing.on('start', () => {
      console.log('DeskThing: App has started successfully!');
      this.isConnected = true;
      this.requestDiscordProfile();
    });
    this.listeners.set('start', startListener);

    const stopListener = this.deskThing.on('stop', () => {
      console.log('DeskThing: App has stopped');
      this.isConnected = false;
    });
    this.listeners.set('stop', stopListener);

    const purgeListener = this.deskThing.on('purge', () => {
      console.log('DeskThing: App is cleaned up');
      this.cleanup();
    });
    this.listeners.set('purge', purgeListener);

    // Listen for Discord profile data
    const profileListener = this.deskThing.on('discord_profile', (data: any) => {
      console.log('DeskThing: Discord profile received:', data);
      this.handleDiscordData(data.payload);
    });
    this.listeners.set('discord_profile', profileListener);

    // Listen for settings changes
    const settingsListener = this.deskThing.on('settings', (data: any) => {
      console.log('DeskThing: Settings received:', data.payload);
    });
    this.listeners.set('settings', settingsListener);

    this.isConnected = true;
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

  public async requestDiscordProfile() {
    console.log('DeskThing: Requesting Discord profile');
    try {
      const profileData = await this.deskThing.fetchData('discord', { 
        type: 'get', 
        request: 'profile', 
        payload: {} 
      });
      
      if (profileData) {
        console.log('DeskThing: Profile data fetched:', profileData);
        this.handleDiscordData(profileData);
      }
    } catch (error) {
      console.error('DeskThing: Error fetching Discord profile:', error);
    }
  }

  public refreshDiscordData() {
    console.log('DeskThing: Refreshing Discord data');
    this.requestDiscordProfile();
  }

  // File system methods for LyricStatusMonitor (keeping existing functionality)
  public watchFile(path: string, callback: (event: string, filename: string) => void) {
    console.log('DeskThing: Setting up file watcher for:', path);
    
    const fileListener = this.deskThing.on('file_change', (data: any) => {
      if (data && data.path === path) {
        callback(data.event || 'change', data.filename || '');
      }
    });
    
    this.listeners.set(`file_watch_${path}`, fileListener);
    
    // Request file watching
    this.deskThing.triggerAction({ 
      id: 'watch_file', 
      source: 'client',
      payload: { path } 
    });
  }

  public unwatchFile(path: string) {
    console.log('DeskThing: Removing file watcher for:', path);
    
    // Remove listener
    const listenerKey = `file_watch_${path}`;
    const removeListener = this.listeners.get(listenerKey);
    if (removeListener) {
      removeListener();
      this.listeners.delete(listenerKey);
    }
    
    // Stop watching file
    this.deskThing.triggerAction({ 
      id: 'unwatch_file', 
      source: 'client',
      payload: { path } 
    });
  }

  public async listDirectory(path: string): Promise<string[]> {
    console.log('DeskThing: Listing directory:', path);
    try {
      const result = await this.deskThing.fetchData('filesystem', { 
        type: 'get', 
        request: 'list_directory', 
        payload: { path } 
      });
      return result?.files || [];
    } catch (error) {
      console.error('DeskThing: Error listing directory:', error);
      return [];
    }
  }

  public async getFileStats(path: string): Promise<{ modified: number }> {
    console.log('DeskThing: Getting file stats for:', path);
    try {
      const result = await this.deskThing.fetchData('filesystem', { 
        type: 'get', 
        request: 'file_stats', 
        payload: { path } 
      });
      return { modified: result?.modified || Date.now() };
    } catch (error) {
      console.error('DeskThing: Error getting file stats:', error);
      return { modified: Date.now() };
    }
  }

  public async readFile(path: string): Promise<string> {
    console.log('DeskThing: Reading file:', path);
    try {
      const result = await this.deskThing.fetchData('filesystem', { 
        type: 'get', 
        request: 'read_file', 
        payload: { path } 
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      return result?.content || '';
    } catch (error) {
      console.error('DeskThing: Error reading file:', error);
      throw error;
    }
  }

  public async getSettings() {
    console.log('DeskThing: Getting settings');
    try {
      const settings = await this.deskThing.getSettings();
      console.log('DeskThing: Settings retrieved:', settings);
      return settings;
    } catch (error) {
      console.error('DeskThing: Error getting settings:', error);
      return null;
    }
  }

  public async getMusicData() {
    console.log('DeskThing: Getting music data');
    try {
      const musicData = await this.deskThing.getMusic();
      console.log('DeskThing: Music data retrieved:', musicData);
      return musicData;
    } catch (error) {
      console.error('DeskThing: Error getting music data:', error);
      return null;
    }
  }

  private cleanup() {
    this.isConnected = false;
    this.discordDataCallbacks.clear();
    
    // Clean up all listeners
    this.listeners.forEach((removeListener, key) => {
      try {
        removeListener();
      } catch (error) {
        console.error(`DeskThing: Error removing listener ${key}:`, error);
      }
    });
    this.listeners.clear();
  }

  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    console.log(`DeskThing Log [${level}]: ${message}`, data);
    // Using triggerAction for logging
    this.deskThing.triggerAction({ 
      id: 'log', 
      source: 'client',
      payload: { level, message, data } 
    });
  }

  public sendError(error: Error, context?: string) {
    console.error('DeskThing Error:', error, context);
    this.deskThing.triggerAction({ 
      id: 'error', 
      source: 'client',
      payload: { error: error.message, context } 
    });
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
      
      // Get initial settings
      await this.getSettings();
      
      // Request initial profile data
      await this.requestDiscordProfile();
    } else {
      console.log('DeskThing: Running in standalone mode');
    }
  }
}

export const deskthingIntegration = DeskThingIntegration.getInstance();
