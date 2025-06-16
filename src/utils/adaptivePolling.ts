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
      
      // If changes happen within 10 seconds, increment rapid change counter
      if (timeSinceLastChange < 10000) {
        this.rapidChangeCountRef.current++;
      } else {
        this.rapidChangeCountRef.current = 1;
      }
      
      // Detect Lyric Status mode (3+ rapid changes)
      const wasLyricMode = this.lyricStatusModeRef.current;
      this.lyricStatusModeRef.current = this.rapidChangeCountRef.current >= 3;
      
      if (this.lyricStatusModeRef.current && !wasLyricMode) {
        this.logWithCleanup('useDiscordData: Lyric Status activity detected - entering rapid polling mode');
      }
      
      // Set interval based on mode
      if (this.lyricStatusModeRef.current) {
        this.pollIntervalRef.current = 100; // Very fast for lyrics
        this.logWithCleanup('useDiscordData: Lyric Status mode - using 100ms polling');
      } else {
        this.pollIntervalRef.current = 200; // Normal fast polling
        this.logWithCleanup('useDiscordData: Changes detected, using 200ms polling');
      }
    } else {
      // Increase interval when no changes
      this.unchangedCountRef.current++;
      
      // Check if we should exit Lyric Status mode
      if (this.lyricStatusModeRef.current && this.unchangedCountRef.current >= 5) {
        this.lyricStatusModeRef.current = false;
        this.rapidChangeCountRef.current = 0;
        this.logWithCleanup('useDiscordData: Exiting Lyric Status mode - status stable');
      }
      
      // Adaptive slowdown based on current mode
      if (this.lyricStatusModeRef.current) {
        // In lyric mode, slower progression
        if (this.unchangedCountRef.current >= 5 && this.pollIntervalRef.current < 500) {
          this.pollIntervalRef.current = 500;
          this.logWithCleanup('useDiscordData: Lyric Status mode - slowing to 500ms');
        }
      } else {
        // Normal adaptive slowdown
        if (this.unchangedCountRef.current >= 3 && this.pollIntervalRef.current < 2000) {
          this.pollIntervalRef.current = 2000;
          this.logWithCleanup('useDiscordData: No changes for 3 polls, slowing to 2s');
        } else if (this.unchangedCountRef.current >= 10 && this.pollIntervalRef.current < 5000) {
          this.pollIntervalRef.current = 5000;
          this.logWithCleanup('useDiscordData: No changes for 10 polls, slowing to 5s');
        }
      }
    }
  }

  reset() {
    this.pollIntervalRef.current = 200;
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
