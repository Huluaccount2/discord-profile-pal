
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface PlayerNotificationProps {
  avatarUrl: string;
  username: string;
  message: string;
  server: string;
  channel: string;
  open: boolean;
  onClose: () => void;
}

export const PlayerNotification: React.FC<PlayerNotificationProps> = ({
  avatarUrl,
  username,
  message,
  server,
  channel,
  open,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(onClose, 5000);
    return () => clearTimeout(timeout);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "absolute top-3 left-1/2 z-20 w-[95%] max-w-[400px] -translate-x-1/2 pointer-events-auto select-none drop-shadow-lg transition-all",
        open
          ? "animate-fade-in animate-slide-in-right opacity-100"
          : "animate-fade-out -translate-y-16 opacity-0 pointer-events-none"
      )}
      style={{
        // overlap avoidance/effect styling
        borderRadius: "20px",
        background:
          "linear-gradient(90deg, rgba(34,34,39,0.96) 65%, rgba(48,48,52,0.85) 100%)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.12)",
        border: "1px solid rgba(255,255,255,0.03)",
        padding: "20px 16px",
        display: open ? "flex" : "none",
        alignItems: "center",
        gap: "12px",
        minHeight: "64px",
      }}
      role="alert"
      aria-live="polite"
    >
      <img
        src={avatarUrl}
        alt={username}
        className="w-11 h-11 rounded-full object-cover border border-gray-700 shadow"
        style={{ flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex gap-1 items-center">
          <span className="font-bold text-white">{username}</span>
          <span className="mx-1 text-xs text-gray-400">pinged you in</span>
        </div>
        <div className="text-xs text-blue-300 truncate max-w-full">
          {server}
          <span className="mx-1 text-gray-500">/</span>
          <span className="text-indigo-300">#{channel}</span>
        </div>
        <div className="mt-1 text-[0.98rem] text-white/90 truncate font-medium leading-snug max-w-full">
          {message}
        </div>
      </div>
    </div>
  );
};
