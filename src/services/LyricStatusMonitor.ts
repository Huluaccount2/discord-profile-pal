
import { deskthingIntegration } from "@/utils/deskthing";

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
  private currentCache: LyricStatusCache | null = null;
  private startTime: number = 0;
  private fileWatcherActive = false;
  private syncIntervalId?: NodeJS.Timeout;
  private lastProcessedFile: string | null = null;

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
    
    console.log('LyricStatusMonitor: Starting real file monitoring for:', this.cacheDirectory);
    
    // Start file monitoring
    this.startFileMonitoring();
    
    // Check for existing cache files immediately
    this.checkForCacheFiles();
  }

  public stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Stop file watching
    if (this.fileWatcherActive) {
      deskthingIntegration.unwatchFile(this.cacheDirectory);
      this.fileWatcherActive = false;
    }
    
    // Clear sync interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }
    
    this.currentLyricCallback = undefined;
    this.currentCache = null;
    this.lastProcessedFile = null;
    
    console.log('LyricStatusMonitor: Stopped file monitoring');
  }

  private startFileMonitoring() {
    try {
      // Set up file system watcher for the cache directory
      deskthingIntegration.watchFile(this.cacheDirectory, (event, filename) => {
        console.log(`LyricStatusMonitor: File ${event}: ${filename}`);
        
        // Only process .json files
        if (filename && filename.endsWith('.json')) {
          this.handleFileChange(filename);
        }
      });
      
      this.fileWatcherActive = true;
      console.log('LyricStatusMonitor: File watcher activated for', this.cacheDirectory);
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error setting up file watcher:', error);
      // Fallback to polling if file watching fails
      this.startPollingFallback();
    }
  }

  private startPollingFallback() {
    console.log('LyricStatusMonitor: Using polling fallback (1 second interval)');
    this.syncIntervalId = setInterval(() => {
      this.checkForCacheFiles();
    }, 1000);
  }

  private async handleFileChange(filename: string) {
    try {
      const filePath = `${this.cacheDirectory}\\${filename}`;
      console.log('LyricStatusMonitor: Processing file change:', filePath);
      
      // Add small delay to ensure file write is complete
      setTimeout(() => {
        this.processFile(filePath);
      }, 50);
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error handling file change:', error);
    }
  }

  private async checkForCacheFiles() {
    try {
      const files = await deskthingIntegration.listDirectory(this.cacheDirectory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('LyricStatusMonitor: No cache files found');
        this.currentLyricCallback?.(null);
        return;
      }
      
      // Find the most recently modified file
      let latestFile = '';
      let latestTime = 0;
      
      for (const file of jsonFiles) {
        try {
          const filePath = `${this.cacheDirectory}\\${file}`;
          const stats = await deskthingIntegration.getFileStats(filePath);
          
          if (stats.modified > latestTime) {
            latestTime = stats.modified;
            latestFile = filePath;
          }
        } catch (error) {
          console.error(`LyricStatusMonitor: Error getting stats for ${file}:`, error);
        }
      }
      
      if (latestFile && latestFile !== this.lastProcessedFile) {
        console.log('LyricStatusMonitor: New latest file detected:', latestFile);
        await this.processFile(latestFile);
      }
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error checking cache files:', error);
    }
  }

  private async processFile(filePath: string) {
    try {
      console.log('LyricStatusMonitor: Reading file:', filePath);
      const content = await deskthingIntegration.readFile(filePath);
      
      const cache: LyricStatusCache = JSON.parse(content);
      console.log('LyricStatusMonitor: Parsed cache data:', {
        title: cache.title,
        artist: cache.artist,
        lyricsCount: cache.lyrics?.length || 0,
        duration: cache.duration,
        offset: cache.offset
      });
      
      this.currentCache = cache;
      this.lastProcessedFile = filePath;
      this.startTime = Date.now();
      
      // Start real-time lyric synchronization
      this.startLyricSync();
      
    } catch (error) {
      console.error('LyricStatusMonitor: Error processing file:', filePath, error);
    }
  }

  private startLyricSync() {
    // Clear any existing sync interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    // Start high-frequency sync for smooth lyric updates (100ms)
    this.syncIntervalId = setInterval(() => {
      if (this.currentCache) {
        this.processLyricCache(this.currentCache);
      }
    }, 100);
  }

  private processLyricCache(cache: LyricStatusCache) {
    if (!cache.lyrics || cache.lyrics.length === 0) {
      this.currentLyricCallback?.(null);
      return;
    }

    // Calculate current playback position
    const now = Date.now();
    const elapsed = (now - this.startTime) + (cache.offset || 0);
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

  // Method to update cache directory path
  public setCacheDirectory(path: string) {
    if (this.isMonitoring) {
      console.warn('LyricStatusMonitor: Cannot change cache directory while monitoring is active');
      return;
    }
    
    this.cacheDirectory = path;
    console.log('LyricStatusMonitor: Cache directory updated to:', path);
  }
}

export const lyricStatusMonitor = LyricStatusMonitor.getInstance();
