
import { DeskThing } from 'deskthing-client';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;
  private deskThing: DeskThing;
  private isConnected = false;

  private constructor() {
    this.deskThing = DeskThing.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): DeskThingIntegration {
    if (!DeskThingIntegration.instance) {
      DeskThingIntegration.instance = new DeskThingIntegration();
    }
    return DeskThingIntegration.instance;
  }

  private setupEventListeners() {
    // Listen for DeskThing connection status
    this.deskThing.on('start', () => {
      console.log('DeskThing: App started');
      this.isConnected = true;
    });

    this.deskThing.on('stop', () => {
      console.log('DeskThing: App stopped');
      this.isConnected = false;
    });

    // Handle settings updates
    this.deskThing.on('settings', (settings) => {
      console.log('DeskThing: Settings updated', settings);
      this.handleSettingsUpdate(settings);
    });

    // Handle data requests
    this.deskThing.on('get', (request) => {
      console.log('DeskThing: Data requested', request);
      this.handleDataRequest(request);
    });
  }

  private handleSettingsUpdate(settings: any) {
    // Handle settings updates from DeskThing
    // This could include theme changes, refresh intervals, etc.
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }

  private handleDataRequest(request: any) {
    // Handle data requests from DeskThing
    // This could be for profile data, music status, etc.
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
    // Send current Discord profile data to DeskThing
    try {
      const profileData = await this.getCurrentProfileData();
      this.deskThing.send({
        type: 'discord-profile',
        data: profileData
      });
    } catch (error) {
      console.error('DeskThing: Error sending Discord profile', error);
    }
  }

  private async sendSpotifyStatus() {
    // Send current Spotify status to DeskThing
    try {
      const spotifyData = await this.getCurrentSpotifyData();
      this.deskThing.send({
        type: 'spotify-status',
        data: spotifyData
      });
    } catch (error) {
      console.error('DeskThing: Error sending Spotify status', error);
    }
  }

  private async getCurrentProfileData() {
    // This would integrate with your existing profile hooks
    // For now, return a placeholder
    return {
      username: 'User',
      status: 'online',
      avatar: null
    };
  }

  private async getCurrentSpotifyData() {
    // This would integrate with your existing Spotify hooks
    // For now, return a placeholder
    return {
      isPlaying: false,
      track: null
    };
  }

  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    this.deskThing.sendLog({
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    });
  }

  public sendError(error: Error, context?: string) {
    this.deskThing.sendError({
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    });
  }

  public updateSettings(settings: Record<string, any>) {
    this.deskThing.sendSettings(settings);
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
        await this.deskThing.start();
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
