import React, { useEffect, useRef, forwardRef, useState } from "react";
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
  (
    {
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
    },
    ref
  ) => {
    // Animation state to handle reverse (exit) animation
    const [visible, setVisible] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // When notification is mounted & open, start visible (in), then auto-close in 5s.
    useEffect(() => {
      if (open) {
        setVisible(true);
        // Start auto-close timer (reset if already set)
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setVisible(false);
        }, 5000);
      }
      // Clean up timers on unmount or open change
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      };
    }, [open]);

    // When visible goes false and open is true, play reverse animation, then fully close after 400ms
    useEffect(() => {
      if (!visible && open) {
        animationTimeoutRef.current = setTimeout(() => {
          onClose();
        }, 400);
      }
    }, [visible, open, onClose]);

    // Which text to render depending on type
    let displayMessage: React.ReactNode = null;
    if (hasImage) {
      displayMessage = <span className="italic text-blue-200">contains image</span>;
    } else if (hasGif) {
      displayMessage = <span className="italic text-teal-200">contains gif</span>;
    } else if (hasVoiceMessage) {
      displayMessage = <span className="italic text-violet-200">contains voice message</span>;
    } else if (message) {
      // Display only first 3 lines, with "..." if it's longer
      const lines = message.split("\n");
      const displayLines = lines.slice(0, 3).join("\n");
      displayMessage = (
        <span className="block text-[0.97rem] text-white/90 font-medium leading-snug max-w-full" style={{ whiteSpace: "pre-line" }}>
          {displayLines}
          {lines.length > 3 && <span className="text-white/60 font-bold"> ...</span>}
        </span>
      );
    }

    // Only render when open is true
    if (!open) return null;

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          "absolute left-1/2 z-20 w-[88%] max-w-[345px] -translate-x-1/2 pointer-events-auto select-none drop-shadow-lg transition-all",
          visible
            ? "animate-slide-in-down opacity-100"
            : "animate-slide-out-up opacity-0 pointer-events-none"
        )}
        style={{
          top: 12,
          borderRadius: "13px",
          background: "linear-gradient(90deg, rgba(34,34,39,0.97) 70%, rgba(48,48,52,0.90) 100%)",
          boxShadow: "0 2px 14px rgba(0,0,0,0.16)",
          border: "1px solid rgba(255,255,255,0.05)",
          padding: "10px 8px 10px 13px",
          alignItems: "center",
          display: "flex",
          gap: "9px",
          minHeight: 38,
          fontSize: 15
        }}
        role="alert"
        aria-live="polite"
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-8 h-8 rounded-full object-cover border border-gray-700 shadow"
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

/*
Add these keyframes to your Tailwind config (tailwind.config.ts) under `extend.keyframes`:

      'slide-in-down': {
        '0%': { opacity: 0, transform: 'translateY(-38px) translateX(-50%)' },
        '100%': { opacity: 1, transform: 'translateY(0) translateX(-50%)' },
      },
      'slide-out-up': {
        '0%': { opacity: 1, transform: 'translateY(0) translateX(-50%)' },
        '100%': { opacity: 0, transform: 'translateY(-38px) translateX(-50%)' },
      },
And in `extend.animation`:

      'slide-in-down': 'slide-in-down 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
      'slide-out-up': 'slide-out-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both',

---
*/
