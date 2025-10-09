import { DollarSign } from "lucide-react";

interface PayStatsProps {
  pay?: string;
  className?: string;
}

export const PayStats = ({ pay, className = "" }: PayStatsProps) => {
  if (!pay || pay === "N/A") {
    return (
      <div className={`flex items-center space-x-1 text-muted-foreground ${className}`}>
        <DollarSign className="h-4 w-4" />
        <span className="text-sm">Pay N/A</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 text-green-600 dark:text-green-400 ${className}`}>
      <DollarSign className="h-4 w-4" />
      <span className="text-sm font-medium">{pay}</span>
    </div>
  );
};

