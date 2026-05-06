import React from "react";

interface LoadingDotsProps {
  label?: string;
}

export function LoadingDots({ label = "Loading" }: LoadingDotsProps) {
  return (
    <div className="loading-dots inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}
