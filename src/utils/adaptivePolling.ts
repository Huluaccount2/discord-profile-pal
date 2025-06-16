
export class AdaptivePolling {
  private pollIntervalRef: React.MutableRefObject<number>;
  private unchangedCountRef: React.MutableRefObject<number>;
  private logWithCleanup: (message: string, ...args: any[]) => void;

  constructor(
    pollIntervalRef: React.MutableRefObject<number>,
    unchangedCountRef: React.MutableRefObject<number>,
    logWithCleanup: (message: string, ...args: any[]) => void
  ) {
    this.pollIntervalRef = pollIntervalRef;
    this.unchangedCountRef = unchangedCountRef;
    this.logWithCleanup = logWithCleanup;
  }

  updateInterval(hasChanges: boolean) {
    if (hasChanges) {
      // Reset to fast polling when changes detected
      this.unchangedCountRef.current = 0;
      this.pollIntervalRef.current = 50; // Reset to 50ms
      this.logWithCleanup('useDiscordData: Changes detected, reset to fast polling (50ms)');
    } else {
      // Increase interval when no changes
      this.unchangedCountRef.current++;
      
      if (this.unchangedCountRef.current >= 3 && this.pollIntervalRef.current < 2000) {
        this.pollIntervalRef.current = 2000; // After 3 unchanged, go to 2s
        this.logWithCleanup('useDiscordData: No changes for 3 polls, slowing to 2s');
      } else if (this.unchangedCountRef.current >= 10 && this.pollIntervalRef.current < 5000) {
        this.pollIntervalRef.current = 5000; // After 10 unchanged, go to 5s
        this.logWithCleanup('useDiscordData: No changes for 10 polls, slowing to 5s');
      }
    }
  }

  reset() {
    this.pollIntervalRef.current = 50; // Reset to 50ms
    this.unchangedCountRef.current = 0;
  }

  getCurrentInterval(): number {
    return this.pollIntervalRef.current;
  }
}
