import React from "react";
import { cn } from "@/lib/utils";

type TierBadgeProps = {
  label: string;
  className?: string;
};

export const TierBadge: React.FC<TierBadgeProps> = ({ label, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground",
      className
    )}
  >
    <span aria-hidden className="text-base leading-none">•</span>
    <span>{label}</span>
  </span>
);
