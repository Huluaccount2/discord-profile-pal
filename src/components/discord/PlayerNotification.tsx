
import React, { useEffect, useRef } from "react";
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

export const PlayerNotification: React.FC<PlayerNotificationProps> = ({
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
}) => {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    // Auto-close after 5s
    closeTimeoutRef.current = setTimeout(onClose, 5000);
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [open, onClose]);

  // Render message - cut off after 3 lines, ellipsis, etc
  let displayMessage: React.ReactNode = null;
  if (hasImage) {
    displayMessage = <span className="italic text-blue-200">contains image</span>;
  } else if (hasGif) {
    displayMessage = <span className="italic text-teal-200">contains gif</span>;
  } else if (hasVoiceMessage) {
    displayMessage = <span className="italic text-violet-200">contains voice message</span>;
  } else {
    displayMessage = (
      <span className="block text-[0.97rem] text-white/90 font-medium leading-snug max-w-full line-clamp-3">
        {message}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "absolute left-1/2 z-20 w-[93%] max-w-[370px] -translate-x-1/2 pointer-events-auto select-none drop-shadow-lg transition-all",
        open
          ? "animate-player-notification-in opacity-100"
          : "animate-player-notification-out opacity-0 pointer-events-none",
      )}
      style={{
        top: 12,
        borderRadius: "17px",
        background: "linear-gradient(90deg, rgba(34,34,39,0.97) 70%, rgba(48,48,52,0.90) 100%)",
        boxShadow: "0 2px 14px rgba(0,0,0,0.16)",
        border: "1px solid rgba(255,255,255,0.05)",
        padding: "14px 9px 14px 14px",
        alignItems: "center",
        display: "flex",
        gap: "9px",
        minHeight: 56,
      }}
      role="alert"
      aria-live="polite"
    >
      <img
        src={avatarUrl}
        alt={username}
        className="w-10 h-10 rounded-full object-cover border border-gray-700 shadow"
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
          {(!hasImage && !hasGif && !hasVoiceMessage && message && message.split("\n").length > 3) && (
            <span className="text-white/60 font-bold"> ...</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Animations for slide-in-from-top / slide-out-to-top
// Include in global styles (tailwind.config or index.css/global.css)
/*
@keyframes player-notification-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
@keyframes player-notification-out {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50px);
  }
}
*/
