import React from "react";

interface SwipeForgeLogoProps {
  className?: string;
  size?: number;
}

export function SwipeForgeLogo({ className = "w-7 h-7", size }: SwipeForgeLogoProps) {
  const sizeProps = size ? { width: size, height: size } : {};
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      {...sizeProps}
    >
      <rect width="120" height="120" rx="16" fill="#0C0D12" />
      <rect
        x="1.5"
        y="1.5"
        width="117"
        height="117"
        rx="14.5"
        stroke="#1F2330"
        strokeWidth="1.5"
      />
      <rect x="26" y="26" width="30" height="68" rx="4" fill="#FFFFFF" />
      <rect x="64" y="26" width="30" height="42" rx="4" fill="#FF5500" />
      <circle cx="79" cy="85" r="9" fill="#FF5500" />
    </svg>
  );
}
