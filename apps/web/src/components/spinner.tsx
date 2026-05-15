"use client";

import { DotmCircular11 } from "@/components/ui/dotm-circular-11";

export function Spinner({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
      aria-label="Loading"
    >
      <DotmCircular11
        size={size}
        dotSize={Math.max(1, Math.round(size / 9))}
        animated
      />
    </span>
  );
}
