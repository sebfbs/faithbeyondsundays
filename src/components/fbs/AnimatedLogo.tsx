import { useId, useEffect, useRef } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ size = 64, className = "" }: AnimatedLogoProps) {
  const id = useId();
  const gradientId = `fbs-grad-${id.replace(/:/g, "")}`;
  const pathRef = useRef<SVGPathElement>(null);

  const cx = 50, cy = 50;

  // Single continuous path: center → top → center → right → center → bottom → center → left → center
  const continuousPath = [
    `M ${cx},${cy}`,
    // Top loop
    `C ${cx - 18},${cy - 12} ${cx - 22},${cy - 38} ${cx},${cy - 42}`,
    `C ${cx + 22},${cy - 38} ${cx + 18},${cy - 12} ${cx},${cy}`,
    // Right loop
    `C ${cx + 12},${cy - 18} ${cx + 38},${cy - 22} ${cx + 42},${cy}`,
    `C ${cx + 38},${cy + 22} ${cx + 12},${cy + 18} ${cx},${cy}`,
    // Bottom loop
    `C ${cx + 18},${cy + 12} ${cx + 22},${cy + 38} ${cx},${cy + 42}`,
    `C ${cx - 22},${cy + 38} ${cx - 18},${cy + 12} ${cx},${cy}`,
    // Left loop
    `C ${cx - 12},${cy + 18} ${cx - 38},${cy + 22} ${cx - 42},${cy}`,
    `C ${cx - 38},${cy - 22} ${cx - 12},${cy - 18} ${cx},${cy}`,
  ].join(" ");

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // Trigger reflow then animate
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 2s ease-in-out";
    path.style.strokeDashoffset = "0";
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#89B4D8" />
          <stop offset="45%" stopColor="#D4B896" />
          <stop offset="100%" stopColor="#F0A500" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={continuousPath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
