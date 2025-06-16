
import { useDeskThing } from "@/contexts/DeskThingContext";

export interface LyricStatusCache {
  title?: string;
  artist?: string;
  lyrics?: Array<{
    time: number;
    text: string;
  }>;
  duration?: number;
  offset?: number;
}

export interface CurrentLyric {
  text: string;
  nextText?: string;
  progress: number;
  songInfo?: {
    title: string;
    artist: string;
  };
}

export class LyricStatusMonitor {
  private static instance: LyricStatusMonitor;
  private isMonitoring = false;
  private cacheDirectory = "C:\\Users\\harri\\OneDrive\\lyrics-status-3.0.6a.1\\cache";
  private currentLyricCallback?: (lyric: CurrentLyric | null) => void;
  private intervalId?: NodeJS.Timeout;
  private lastModified = new Map<string, number>();
  private currentCache: LyricStatusCache | null = null;
  private startTime: number = 0;

  private constructor() {}

  public static getInstance(): LyricStatusMonitor {
    if (!LyricStatusMonitor.instance) {
      LyricStatusMonitor.instance = new LyricStatusMonitor();
    }
    return LyricStatusMonitor.instance;
  }

  public startMonitoring(callback: (lyric: CurrentLyric | null) => void) {
    if (this.isMonitoring) return;

    this.currentLyricCallback = callback;
    this.isMonitoring = true;
    
    console.log('LyricStatusMonitor: Starting file monitoring for:', this.cacheDirectory);
    
    // Check for cache files immediately
    this.checkForCacheFiles();
    
    // Set up regular polling for file changes (100ms for real-time feel)
    this.intervalId = setInterval(() => {
      this.checkForCacheFiles();
    }, 100);
  }

  public stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.currentLyricCallback = undefined;
    this.currentCache = null;
    this.lastModified.clear();
    
    console.log('LyricStatusMonitor: Stopped monitoring');
  }

  private async checkForCacheFiles() {
    try {
      // For now, we'll simulate file system access
      // In a real implementation on DeskThing, we'd use the DeskThing client's file system API
      
      // Try to read the most recent cache file
      await this.readLatestCacheFile();
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error checking cache files:', error);
    }
  }

  private async readLatestCacheFile() {
    try {
      // For web environment, we can't directly access file system
      // This would need to be implemented through DeskThing client or a local service
      
      // Placeholder implementation - in real scenario, this would:
      // 1. List files in the cache directory
      // 2. Find the most recently modified .json file
      // 3. Read and parse the JSON content
      // 4. Update currentCache if the file has changed
      
      console.log('LyricStatusMonitor: Attempting to read cache files from:', this.cacheDirectory);
      
      // For now, we'll simulate this functionality
      // In production, this would integrate with DeskThing's file system API
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error reading cache file:', error);
    }
  }

  private processLyricCache(cache: LyricStatusCache) {
    if (!cache.lyrics || cache.lyrics.length === 0) {
      this.currentLyricCallback?.(null);
      return;
    }

    // Calculate current playback position
    const now = Date.now();
    const elapsed = now - this.startTime + (cache.offset || 0);
    const position = elapsed / 1000; // Convert to seconds

    // Find current lyric based on timestamp
    let currentLyric = cache.lyrics[0];
    let nextLyric = cache.lyrics[1];

    for (let i = 0; i < cache.lyrics.length; i++) {
      if (position >= cache.lyrics[i].time) {
        currentLyric = cache.lyrics[i];
        nextLyric = cache.lyrics[i + 1];
      } else {
        break;
      }
    }

    const progress = cache.duration ? (position / cache.duration) * 100 : 0;

    const result: CurrentLyric = {
      text: currentLyric.text,
      nextText: nextLyric?.text,
      progress: Math.max(0, Math.min(100, progress)),
      songInfo: {
        title: cache.title || 'Unknown Title',
        artist: cache.artist || 'Unknown Artist'
      }
    };

    this.currentLyricCallback?.(result);
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }

  // Method to manually set cache data (for testing or external integration)
  public setCacheData(cache: LyricStatusCache) {
    this.currentCache = cache;
    this.startTime = Date.now();
    this.processLyricCache(cache);
  }
}

export const lyricStatusMonitor = LyricStatusMonitor.getInstance();
