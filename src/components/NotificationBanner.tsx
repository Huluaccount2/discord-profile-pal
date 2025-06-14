
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
          className="relative w-full max-w-md mx-auto pointer-events-auto"
        >
          <div className="relative bg-background text-foreground border shadow-lg rounded-2xl flex gap-3 items-center p-4 pr-10 animate-slide-in-right">
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt={`${username} avatar`}
              className="h-12 w-12 rounded-full object-cover bg-muted border"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{username}</span>
                <span className="text-xs text-gray-400">
                  pinged you in <span className="font-medium">{channel}</span>
                  {" "}
                  <span className="text-gray-500">· {server}</span>
                </span>
              </div>
              <div className="mt-0.5 text-sm">{message}</div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-foreground"
              onClick={onClose}
              aria-label="Dismiss"
              tabIndex={0}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
