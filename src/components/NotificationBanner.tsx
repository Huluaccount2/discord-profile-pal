
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBannerProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  username: string;
  message: string;
  server: string;
  channel: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  open,
  onClose,
  avatarUrl,
  username,
  message,
  server,
  channel,
}) => {
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      autoCloseTimer.current = setTimeout(onClose, 5000);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 34 }}
          className="relative w-full max-w-md pointer-events-auto"
          style={{
            // Make sure it looks like it's "above" the player, on a white or darkened (but solid) background
            // with a subtle shadow and rounded corners
            marginTop: 16, // Small vertical padding from top of player
          }}
        >
          <div className="relative bg-background/90 text-foreground border shadow-2xl rounded-2xl flex gap-3 items-center p-4 pr-10"
               style={{
                 background: 'rgba(22, 24, 32, 0.92)', // iPhone notification style w/ a dark translucent background
                 boxShadow: '0 4px 32px 4px rgba(0,0,0,0.28)',
                 border: '1px solid rgba(80, 80, 80, 0.14)',
                 backdropFilter: 'blur(6px)',
               }}>
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt={`${username} avatar`}
              className="h-12 w-12 rounded-full object-cover bg-muted border"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate">{username}</span>
                <span className="text-xs text-gray-400 truncate">
                  pinged you in <span className="font-medium">{channel}</span>
                  {" "}
                  <span className="text-gray-500">· {server}</span>
                </span>
              </div>
              <div className="mt-0.5 text-sm text-white break-words">{message}</div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white bg-black/10 rounded-full p-1"
              onClick={onClose}
              aria-label="Dismiss"
              tabIndex={0}
              type="button"
              style={{
                pointerEvents: 'auto' // Allow proper click event
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
