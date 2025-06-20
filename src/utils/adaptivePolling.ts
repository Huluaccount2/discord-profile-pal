
import React from 'react';

export class AdaptivePolling {
  private pollIntervalRef: React.MutableRefObject<number>;
  private unchangedCountRef: React.MutableRefObject<number>;
  private rapidChangeCountRef: React.MutableRefObject<number>;
  private lastChangeTimeRef: React.MutableRefObject<number>;
  private lyricStatusModeRef: React.MutableRefObject<boolean>;
  private logWithCleanup: (message: string, ...args: any[]) => void;

  constructor(
    pollIntervalRef: React.MutableRefObject<number>,
    unchangedCountRef: React.MutableRefObject<number>,
    logWithCleanup: (message: string, ...args: any[]) => void
  ) {
    this.pollIntervalRef = pollIntervalRef;
    this.unchangedCountRef = unchangedCountRef;
    this.rapidChangeCountRef = React.useRef(0);
    this.lastChangeTimeRef = React.useRef(Date.now());
    this.lyricStatusModeRef = React.useRef(false);
    this.logWithCleanup = logWithCleanup;
  }

  updateInterval(hasChanges: boolean) {
    const now = Date.now();
    
    if (hasChanges) {
      // Reset unchanged counter
      this.unchangedCountRef.current = 0;
      
      // Track rapid changes for Lyric Status detection
      const timeSinceLastChange = now - this.lastChangeTimeRef.current;
      this.lastChangeTimeRef.current = now;
      
      // If changes happen within 20 seconds, increment rapid change counter
      if (timeSinceLastChange < 20000) {
        this.rapidChangeCountRef.current++;
      } else {
        this.rapidChangeCountRef.current = 1;
      }
      
      // Detect Lyric Status mode (1+ rapid changes - immediate detection)
      const wasLyricMode = this.lyricStatusModeRef.current;
      this.lyricStatusModeRef.current = this.rapidChangeCountRef.current >= 1;
      
      if (this.lyricStatusModeRef.current && !wasLyricMode) {
        this.logWithCleanup('useDiscordData: Lyric Status activity detected - entering ultra-fast polling mode');
      }
      
      // Set interval based on mode - much more aggressive
      if (this.lyricStatusModeRef.current) {
        this.pollIntervalRef.current = 50; // Ultra fast for lyrics (50ms)
        this.logWithCleanup('useDiscordData: Lyric Status mode - using 50ms polling');
      } else {
        this.pollIntervalRef.current = 100; // Fast polling for other changes
        this.logWithCleanup('useDiscordData: Changes detected, using 100ms polling');
      }
    } else {
      // Increase interval when no changes
      this.unchangedCountRef.current++;
      
      // Check if we should exit Lyric Status mode - be more patient
      if (this.lyricStatusModeRef.current && this.unchangedCountRef.current >= 10) {
        this.lyricStatusModeRef.current = false;
        this.rapidChangeCountRef.current = 0;
        this.logWithCleanup('useDiscordData: Exiting Lyric Status mode - status stable for 10 cycles');
      }
      
      // Adaptive slowdown based on current mode
      if (this.lyricStatusModeRef.current) {
        // In lyric mode, stay fast longer
        if (this.unchangedCountRef.current >= 8 && this.pollIntervalRef.current < 200) {
          this.pollIntervalRef.current = 200;
          this.logWithCleanup('useDiscordData: Lyric Status mode - slowing to 200ms');
        }
      } else {
        // Normal adaptive slowdown
        if (this.unchangedCountRef.current >= 5 && this.pollIntervalRef.current < 1000) {
          this.pollIntervalRef.current = 1000;
          this.logWithCleanup('useDiscordData: No changes for 5 polls, slowing to 1s');
        } else if (this.unchangedCountRef.current >= 15 && this.pollIntervalRef.current < 5000) {
          this.pollIntervalRef.current = 5000;
          this.logWithCleanup('useDiscordData: No changes for 15 polls, slowing to 5s');
        }
      }
    }
  }

  reset() {
    this.pollIntervalRef.current = 100;
    this.unchangedCountRef.current = 0;
    this.rapidChangeCountRef.current = 0;
    this.lastChangeTimeRef.current = Date.now();
    this.lyricStatusModeRef.current = false;
  }

  getCurrentInterval(): number {
    return this.pollIntervalRef.current;
  }

  isLyricStatusMode(): boolean {
    return this.lyricStatusModeRef.current;
  }
}
