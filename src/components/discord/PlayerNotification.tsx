
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
    // Set up internal show/hide state which ignores parent open after mount
    const [internalOpen, setInternalOpen] = useState(false);
    const [visible, setVisible] = useState(false);

    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // When the component is initially opened, run show logic and timer once.
    useEffect(() => {
      if (open) {
        setInternalOpen(true); // Mount the notification
        setVisible(true);      // Trigger slide-in animation

        // Setup a 5s dismiss timer only once per open cycle
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setVisible(false);  // Trigger exit animation
        }, 5000);
      } else {
        // if parent forcibly closes, immediately begin close animation
        setVisible(false);
      }

      // Cleanup on unmount/change
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      };
    }, [open]);

    // When slide-out animation ends, unmount component and notify parent
    useEffect(() => {
      if (!visible && internalOpen) {
        animationTimeoutRef.current = setTimeout(() => {
          setInternalOpen(false); // Actually remove from DOM
          onClose?.();
        }, 400); // Match animation duration
      }
    }, [visible, internalOpen, onClose]);

    // Only render if internalOpen is true
    if (!internalOpen) return null;

    // Render message type
    let displayMessage: React.ReactNode = null;
    if (hasImage) {
      displayMessage = <span className="italic text-blue-200">contains image</span>;
    } else if (hasGif) {
      displayMessage = <span className="italic text-teal-200">contains gif</span>;
    } else if (hasVoiceMessage) {
      displayMessage = <span className="italic text-violet-200">contains voice message</span>;
    } else if (message) {
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
