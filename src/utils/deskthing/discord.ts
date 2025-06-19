
import { deskThingCore } from './core';
import { deskThingLogger } from './logger';

export class DeskThingDiscord {
  private static instance: DeskThingDiscord;
  private discordDataCallbacks = new Set<(data: any) => void>();
  private listeners = new Map<string, () => void>();

  private constructor() {
    this.setupDiscordListeners();
  }

  public static getInstance(): DeskThingDiscord {
    if (!DeskThingDiscord.instance) {
      DeskThingDiscord.instance = new DeskThingDiscord();
    }
    return DeskThingDiscord.instance;
  }

  private setupDiscordListeners() {
    const deskThing = deskThingCore.getDeskThingInstance();
    
    const profileListener = deskThing.on('discord_profile', (data: any) => {
      console.log('DeskThing: Discord profile received:', data);
      this.handleDiscordData(data.payload);
    });
    this.listeners.set('discord_profile', profileListener);
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
      const deskThing = deskThingCore.getDeskThingInstance();
      const profileData = await deskThing.fetchData('discord', { 
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
      deskThingLogger.sendError(error as Error, 'Discord profile fetch');
    }
  }

  public refreshDiscordData() {
    console.log('DeskThing: Refreshing Discord data');
    this.requestDiscordProfile();
  }

  public cleanup() {
    this.discordDataCallbacks.clear();
    
    this.listeners.forEach((removeListener, key) => {
      try {
        removeListener();
      } catch (error) {
        console.error(`DeskThing: Error removing Discord listener ${key}:`, error);
      }
    });
    this.listeners.clear();
  }
}

export const deskThingDiscord = DeskThingDiscord.getInstance();
