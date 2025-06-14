
import React, { useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PlayerNotificationProps {
  avatarUrl: string;
  username: string;
  message: string;
  server: string;
  channel: string;
  open: boolean;
  onClose: () => void;
  hasImage?: boolean;
  hasGif?: boolean;
  hasVoiceMessage?: boolean;
}

export const PlayerNotification = forwardRef<HTMLDivElement, PlayerNotificationProps>(
  ({
    avatarUrl,
    username,
    message,
    server,
    channel,
    open,
    onClose,
    hasImage,
    hasGif,
    hasVoiceMessage
  }, ref) => {
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!open) return;
      closeTimeoutRef.current = setTimeout(onClose, 5000);
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, [open, onClose]);

    // Render message, ellipsis for >3 lines, and "contains {type}" logic.
    let displayMessage: React.ReactNode = null;
    if (hasImage) {
      displayMessage = <span className="italic text-blue-200">contains image</span>;
    } else if (hasGif) {
      displayMessage = <span className="italic text-teal-200">contains gif</span>;
    } else if (hasVoiceMessage) {
      displayMessage = <span className="italic text-violet-200">contains voice message</span>;
    } else if (message) {
      // Display first 3 lines, then ...
      const lines = message.split("\n");
      const displayLines = lines.slice(0, 3).join("\n");
      displayMessage = (
        <span className="block text-[0.97rem] text-white/90 font-medium leading-snug max-w-full" style={{ whiteSpace: "pre-line" }}>
          {displayLines}
          {lines.length > 3 && <span className="text-white/60 font-bold"> ...</span>}
        </span>
      );
    }

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          "absolute left-1/2 z-20 w-[93%] max-w-[370px] -translate-x-1/2 pointer-events-auto select-none drop-shadow-lg transition-all",
          open
            ? "animate-player-notification-in opacity-100"
            : "animate-player-notification-out opacity-0 pointer-events-none",
        )}
        style={{
          top: 12,
          borderRadius: "15px",
          background: "linear-gradient(90deg, rgba(34,34,39,0.97) 70%, rgba(48,48,52,0.90) 100%)",
          boxShadow: "0 2px 14px rgba(0,0,0,0.16)",
          border: "1px solid rgba(255,255,255,0.05)",
          padding: "12px 8px 12px 13px",
          alignItems: "center",
          display: "flex",
          gap: "9px",
          minHeight: 44,
          fontSize: 15
        }}
        role="alert"
        aria-live="polite"
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-9 h-9 rounded-full object-cover border border-gray-700 shadow"
          style={{ flexShrink: 0 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex gap-1 items-center mb-0.5">
            <span className="font-semibold text-white text-sm">{username}</span>
            <span className="mx-1 text-xs text-gray-400 font-normal">pinged you in</span>
          </div>
          <div className="text-xs text-blue-300 truncate max-w-full mb-0.5">
            {server}
            <span className="mx-1 text-gray-500 font-medium">/</span>
            <span className="text-indigo-300">#{channel}</span>
          </div>
          <div className="max-w-full overflow-hidden">
            {displayMessage}
          </div>
        </div>
      </div>
    );
  }
);

PlayerNotification.displayName = "PlayerNotification";

// Tailwind anim keyframes (add to global CSS or tailwind config):
// @keyframes player-notification-in {
//   0% { opacity:0; transform:translate(-50%,-38px); }
//   100% { opacity:1; transform:translate(-50%,0); }
// }
// @keyframes player-notification-out {
//   0% { opacity:1; transform:translate(-50%,0); }
//   100% { opacity:0; transform:translate(-50%,-38px); }
// }
