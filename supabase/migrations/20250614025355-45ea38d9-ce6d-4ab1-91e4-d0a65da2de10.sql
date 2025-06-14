
-- Add Spotify token fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN spotify_access_token TEXT,
ADD COLUMN spotify_refresh_token TEXT,
ADD COLUMN spotify_token_expires_at TIMESTAMP WITH TIME ZONE;
