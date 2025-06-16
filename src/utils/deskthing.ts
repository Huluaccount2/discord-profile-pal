
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
