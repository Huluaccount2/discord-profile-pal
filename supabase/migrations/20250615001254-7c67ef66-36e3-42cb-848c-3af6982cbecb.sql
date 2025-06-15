
-- 1. Drop RLS policies (so we can safely change the column type)
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users/bots can insert notifications" ON public.notifications;

-- 2. Alter user_id column from uuid to text
ALTER TABLE public.notifications
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. Recreate the policies with type matches
CREATE POLICY "Users can view their notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users/bots can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR true);
