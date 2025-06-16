
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

  return (
    <div className="text-left h-full">
      <h3 className="text-xs font-semibold text-gray-300 mb-3">CONNECTIONS</h3>
      <div className="space-y-4 overflow-y-auto max-h-full">
        {connections.map((connection, index) => (
          <ConnectionItem key={index} connection={connection} />
        ))}
      </div>
    </div>
  );
};
