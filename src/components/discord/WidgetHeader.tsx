
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetHeaderProps {
  currentTime: Date;
  refreshing: boolean;
  onRefresh: () => void;
  hideRefreshButton?: boolean;
}

export const WidgetHeader = ({ currentTime, refreshing, onRefresh, hideRefreshButton = false }: WidgetHeaderProps) => {
  return null;
};
