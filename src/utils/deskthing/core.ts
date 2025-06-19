
import { DeskThing as DT } from 'deskthing-client';

export class DeskThingCore {
  private static instance: DeskThingCore;
  private isConnected = false;
  private deskThing: any;
  private listeners = new Map<string, () => void>();

  private constructor() {
    // Handle different ways the DeskThing client might be exported
    this.deskThing = DT;
    
    // Add safety check and logging
    console.log('DeskThing client object:', this.deskThing);
    console.log('DeskThing methods:', this.deskThing ? Object.keys(this.deskThing) : 'undefined');
    
    if (this.deskThing && typeof this.deskThing.on === 'function') {
      this.setupCoreListeners();
    } else {
      console.warn('DeskThing: Client not available or missing .on method, running in fallback mode');
      this.isConnected = false;
    }
  }

  public static getInstance(): DeskThingCore {
    if (!DeskThingCore.instance) {
      DeskThingCore.instance = new DeskThingCore();
    }
    return DeskThingCore.instance;
  }

  private setupCoreListeners() {
    console.log('DeskThing: Setting up core integration');
    
    try {
      const startListener = this.deskThing.on('start', () => {
        console.log('DeskThing: App has started successfully!');
        this.isConnected = true;
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

      const settingsListener = this.deskThing.on('settings', (data: any) => {
        console.log('DeskThing: Settings received:', data.payload);
      });
      this.listeners.set('settings', settingsListener);

      this.isConnected = true;
    } catch (error) {
      console.error('DeskThing: Error setting up core listeners:', error);
      this.isConnected = false;
    }
  }

  public getDeskThingInstance() {
    return this.deskThing;
  }

  public isRunningOnDeskThing(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).DeskThing !== 'undefined';
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async getSettings() {
    console.log('DeskThing: Getting settings');
    try {
      if (!this.deskThing || typeof this.deskThing.getSettings !== 'function') {
        console.warn('DeskThing: getSettings not available');
        return null;
      }
      
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
      if (!this.deskThing || typeof this.deskThing.getMusic !== 'function') {
        console.warn('DeskThing: getMusic not available');
        return null;
      }
      
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
    
    this.listeners.forEach((removeListener, key) => {
      try {
        removeListener();
      } catch (error) {
        console.error(`DeskThing: Error removing listener ${key}:`, error);
      }
    });
    this.listeners.clear();
  }

  public async initialize() {
    if (this.isRunningOnDeskThing()) {
      console.log('DeskThing: Initializing Discord Profile Pal integration');
      await this.getSettings();
    } else {
      console.log('DeskThing: Running in standalone mode');
    }
  }
}

export const deskThingCore = DeskThingCore.getInstance();
