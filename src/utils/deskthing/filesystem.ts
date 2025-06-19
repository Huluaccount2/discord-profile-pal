
import { deskThingCore } from './core';

export class DeskThingFileSystem {
  private static instance: DeskThingFileSystem;
  private listeners = new Map<string, () => void>();

  private constructor() {}

  public static getInstance(): DeskThingFileSystem {
    if (!DeskThingFileSystem.instance) {
      DeskThingFileSystem.instance = new DeskThingFileSystem();
    }
    return DeskThingFileSystem.instance;
  }

  public watchFile(path: string, callback: (event: string, filename: string) => void) {
    console.log('DeskThing: Setting up file watcher for:', path);
    
    const deskThing = deskThingCore.getDeskThingInstance();
    
    if (!deskThing || typeof deskThing.on !== 'function') {
      console.warn('DeskThing: File watching not available');
      return;
    }
    
    try {
      const fileListener = deskThing.on('file_change', (data: any) => {
        if (data && data.path === path) {
          callback(data.event || 'change', data.filename || '');
        }
      });
      
      this.listeners.set(`file_watch_${path}`, fileListener);
      
      if (typeof deskThing.triggerAction === 'function') {
        deskThing.triggerAction({ 
          id: 'watch_file', 
          source: 'client',
          payload: { path } 
        });
      }
    } catch (error) {
      console.error('DeskThing: Error setting up file watcher:', error);
    }
  }

  public unwatchFile(path: string) {
    console.log('DeskThing: Removing file watcher for:', path);
    
    const listenerKey = `file_watch_${path}`;
    const removeListener = this.listeners.get(listenerKey);
    if (removeListener) {
      removeListener();
      this.listeners.delete(listenerKey);
    }
    
    const deskThing = deskThingCore.getDeskThingInstance();
    if (deskThing && typeof deskThing.triggerAction === 'function') {
      deskThing.triggerAction({ 
        id: 'unwatch_file', 
        source: 'client',
        payload: { path } 
      });
    }
  }

  public async listDirectory(path: string): Promise<string[]> {
    console.log('DeskThing: Listing directory:', path);
    try {
      const deskThing = deskThingCore.getDeskThingInstance();
      
      if (!deskThing || typeof deskThing.fetchData !== 'function') {
        console.warn('DeskThing: Directory listing not available');
        return [];
      }
      
      const result = await deskThing.fetchData('filesystem', { 
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
      const deskThing = deskThingCore.getDeskThingInstance();
      
      if (!deskThing || typeof deskThing.fetchData !== 'function') {
        console.warn('DeskThing: File stats not available');
        return { modified: Date.now() };
      }
      
      const result = await deskThing.fetchData('filesystem', { 
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
      const deskThing = deskThingCore.getDeskThingInstance();
      
      if (!deskThing || typeof deskThing.fetchData !== 'function') {
        console.warn('DeskThing: File reading not available');
        throw new Error('File system not available');
      }
      
      const result = await deskThing.fetchData('filesystem', { 
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

  public cleanup() {
    this.listeners.forEach((removeListener, key) => {
      try {
        removeListener();
      } catch (error) {
        console.error(`DeskThing: Error removing filesystem listener ${key}:`, error);
      }
    });
    this.listeners.clear();
  }
}

export const deskThingFileSystem = DeskThingFileSystem.getInstance();
