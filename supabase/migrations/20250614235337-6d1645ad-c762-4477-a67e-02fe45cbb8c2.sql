
-- Create a notifications table for Discord mentions, DMs, etc. using uuid for user_id
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                       -- Discord/Supabase user the notification is for
  source_user_id TEXT,                         -- The user who triggered the event (e.g., who mentioned you)
  source_user_avatar TEXT,                     -- Avatar of the source user
  source_username TEXT,                        -- Username of person who mentioned you etc.
  message TEXT,                                -- Raw message (for display)
  server TEXT,                                 -- Server name (if available)
  channel TEXT,                                -- Channel name (if available)
  type TEXT NOT NULL DEFAULT 'mention',        -- E.g., mention, direct_message, etc.
  has_image BOOLEAN DEFAULT FALSE,
  has_gif BOOLEAN DEFAULT FALSE,
  has_voice_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS so only each user can see their notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy so each user can read their own notifications
CREATE POLICY "Users can view their notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy so user or bot can insert notification (edit as needed for your bot's auth context)
CREATE POLICY "Users/bots can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR true); -- Loosen if using a service/bot API role

