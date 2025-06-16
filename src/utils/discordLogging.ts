
// Message cleanup utility
const cleanupOldLogs = () => {
  const MAX_CONSOLE_LOGS = 200;
  
  // Clear console to prevent memory issues
  if (typeof window !== 'undefined' && window.console) {
    try {
      console.clear();
      console.log('useDiscordData: Console cleared to prevent memory issues - message limit reached');
    } catch (e) {
      // Fallback if console.clear() fails
      console.log('useDiscordData: Attempted console cleanup');
    }
  }
};

export const createLogWithCleanup = (messageCountRef: React.MutableRefObject<number>) => {
  return (message: string, ...args: any[]) => {
    messageCountRef.current++;
    
    // Clean up every 200 messages
    if (messageCountRef.current >= 200) {
      cleanupOldLogs();
      messageCountRef.current = 0; // Reset counter after cleanup
      console.log(`useDiscordData: Message count reset after reaching 200 messages`);
    }
    
    console.log(message, ...args);
  };
};
