
import { ConnectionItem } from "./ConnectionItem";

interface Connection {
  type: string;
  name: string;
  id: string;
  verified: boolean;
}

interface ConnectionsListProps {
  connections: Connection[];
}

export const ConnectionsList = ({ connections }: ConnectionsListProps) => {
  if (connections.length === 0) {
    return null;
  }

  // Limit connections for Car Thing display
  const displayConnections = connections.slice(0, 4);

  return (
    <div className="text-left">
      <h3 className="text-xs font-semibold text-gray-300 mb-2">CONNECTIONS</h3>
      <div className="space-y-2 overflow-y-auto max-h-[200px]">
        {displayConnections.map((connection, index) => (
          <ConnectionItem key={index} connection={connection} />
        ))}
        {connections.length > 4 && (
          <div className="text-xs text-gray-500 px-2">
            +{connections.length - 4} more
          </div>
        )}
      </div>
    </div>
  );
};
