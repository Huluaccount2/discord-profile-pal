
// Main integration class that combines all modules
import { deskThingCore } from './core';
import { deskThingDiscord } from './discord';
import { deskThingFileSystem } from './filesystem';
import { deskThingLogger } from './logger';

export class DeskThingIntegration {
  private static instance: DeskThingIntegration;

  private constructor() {}

  public static getInstance(): DeskThingIntegration {
    if (!DeskThingIntegration.instance) {
      DeskThingIntegration.instance = new DeskThingIntegration();
    }
    return DeskThingIntegration.instance;
  }

  // Core methods
  public isRunningOnDeskThing(): boolean {
    return deskThingCore.isRunningOnDeskThing();
  }

  public getConnectionStatus(): boolean {
    return deskThingCore.getConnectionStatus();
  }

  public async getSettings() {
    return deskThingCore.getSettings();
  }

  public async getMusicData() {
    return deskThingCore.getMusicData();
  }

  public async initialize() {
    return deskThingCore.initialize();
  }

  // Discord methods
  public onDiscordData(callback: (data: any) => void) {
    return deskThingDiscord.onDiscordData(callback);
  }

  public async requestDiscordProfile() {
    return deskThingDiscord.requestDiscordProfile();
  }

  public refreshDiscordData() {
    return deskThingDiscord.refreshDiscordData();
  }

  // File system methods
  public watchFile(path: string, callback: (event: string, filename: string) => void) {
    return deskThingFileSystem.watchFile(path, callback);
  }

  public unwatchFile(path: string) {
    return deskThingFileSystem.unwatchFile(path);
  }

  public async listDirectory(path: string): Promise<string[]> {
    return deskThingFileSystem.listDirectory(path);
  }

  public async getFileStats(path: string): Promise<{ modified: number }> {
    return deskThingFileSystem.getFileStats(path);
  }

  public async readFile(path: string): Promise<string> {
    return deskThingFileSystem.readFile(path);
  }

  // Logging methods
  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    return deskThingLogger.sendLog(level, message, data);
  }

  public sendError(error: Error, context?: string) {
    return deskThingLogger.sendError(error, context);
  }
}

export const deskthingIntegration = DeskThingIntegration.getInstance();

// Re-export individual modules for direct access if needed
export { deskThingCore } from './core';
export { deskThingDiscord } from './discord';
export { deskThingFileSystem } from './filesystem';
export { deskThingLogger } from './logger';
