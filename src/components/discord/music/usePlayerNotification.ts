
import { useState, useEffect, useRef, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export interface PlayerNotificationData {
  avatarUrl: string;
  username: string;
  message: string;
  server: string;
  channel: string;
  hasImage?: boolean;
  hasGif?: boolean;
  hasVoiceMessage?: boolean;
}

/**
 * Custom hook for managing music player notification logic and dynamic height.
 */
export function usePlayerNotification() {
  const { notifications } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<PlayerNotificationData>({
    avatarUrl: "",
    username: "",
    message: "",
    server: "",
    channel: "",
  });
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [notifHeight, setNotifHeight] = useState(0);

  // Display the latest notification if present.
  useEffect(() => {
    if (notifications.length > 0) {
      const notif = notifications[0];
      setNotificationData({
        avatarUrl: notif.source_user_avatar || "",
        username: notif.source_username || "Unknown",
        message: notif.message || "",
        server: notif.server || "",
        channel: notif.channel || "",
        hasImage: notif.has_image,
        hasGif: notif.has_gif,
        hasVoiceMessage: notif.has_voice_message,
      });
      setNotificationOpen(true);
    }
    // eslint-disable-next-line
  }, [notifications.length > 0 ? notifications[0].id : null]);

  // Observe and update notifHeight on open/close
  useEffect(() => {
    if (notificationOpen && notificationRef.current) {
      const rect = notificationRef.current.getBoundingClientRect();
      setNotifHeight(rect.height);
    } else {
      setNotifHeight(0);
    }
  }, [notificationOpen, notificationData]);

  // Handler to close notification
  const handleNotificationClose = useCallback(() => setNotificationOpen(false), []);

  // Demo/test notification handler (optionally used in consuming components)
  const showDemoNotification = (variant: "text" | "image" | "gif" | "voice" = "text") => {
    setNotificationData({
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      username: "Alex McLean",
      message:
        variant === "text"
          ? "Hey @you! Let's finish the playlist collab soon. Did you check all 4 songs I posted in #music-collab? DM me 😁\nExtra: with\nNewlines\nto test."
          : "",
      server: "Chill Hub",
      channel: "music-chat",
      hasImage: variant === "image" ? true : undefined,
      hasGif: variant === "gif" ? true : undefined,
      hasVoiceMessage: variant === "voice" ? true : undefined,
    });
    setNotificationOpen(true);
  };

  return {
    notificationOpen,
    notificationData,
    notificationRef,
    notifHeight,
    handleNotificationClose,
    showDemoNotification,
  };
}
