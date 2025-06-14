
export interface UserProfile {
  discord_id: string | null;
  discord_username: string | null;
  discord_discriminator: string | null;
  discord_avatar: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface DiscordActivity {
  name: string;
  type: number;
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
}

export interface DiscordData {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    banner?: string | null;
  };
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: DiscordActivity[];
  avatar_url: string | null;
}
