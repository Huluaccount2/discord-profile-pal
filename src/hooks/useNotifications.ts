
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  source_user_id?: string;
  source_user_avatar?: string;
  source_username?: string;
  message?: string;
  server?: string;
  channel?: string;
  type: string;
  has_image?: boolean;
  has_gif?: boolean;
  has_voice_message?: boolean;
  created_at?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setNotifications(data || []);
        }
        setLoading(false);
      });
  }, [user?.id]);

  return { notifications, loading, error };
}
