
interface ConnectionItemProps {
  connection: {
    type: string;
    name: string;
    id: string;
    verified: boolean;
  };
}

export const ConnectionItem = ({ connection }: ConnectionItemProps) => {
  const getConnectionLogo = (type: string) => {
    const logoUrls = {
      spotify: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg',
      github: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
      youtube: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
      twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg',
      twitch: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg',
      steam: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/steam.svg',
      xbox: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/xbox.svg',
      battlenet: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/battle-dot-net.svg',
      reddit: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg',
      facebook: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
      instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
      tiktok: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
      epicgames: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/epicgames.svg',
      riotgames: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/riotgames.svg',
      playstation: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/playstation.svg',
      roblox: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roblox.svg'
    };
    return logoUrls[type.toLowerCase()] || null;
  };

  const getConnectionColor = (type: string) => {
    const colors = {
      spotify: 'bg-green-600',
      github: 'bg-gray-800',
      youtube: 'bg-red-600',
      twitter: 'bg-blue-500',
      twitch: 'bg-purple-600',
      steam: 'bg-blue-900',
      xbox: 'bg-green-700',
      battlenet: 'bg-blue-800',
      reddit: 'bg-orange-600',
      facebook: 'bg-blue-600',
      instagram: 'bg-pink-600',
      tiktok: 'bg-black',
      epicgames: 'bg-gray-900',
      riotgames: 'bg-red-700',
      playstation: 'bg-blue-700',
      roblox: 'bg-black'
    };
    return colors[type.toLowerCase()] || 'bg-gray-700';
  };

  const logoUrl = getConnectionLogo(connection.type);
  const colorClass = getConnectionColor(connection.type);

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
      <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center p-1.5`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${connection.type} logo`}
            className="w-full h-full filter invert"
            style={{ filter: 'invert(1) brightness(1)' }}
          />
        ) : (
          <span className="text-xs text-white font-bold">
            {connection.type.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white capitalize truncate">{connection.type}</span>
          {connection.verified && (
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white">✓</span>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-300 font-medium block truncate">{connection.name}</span>
      </div>
    </div>
  );
};
