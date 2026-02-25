import { useEffect, useRef } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ size = 64, className = "" }: AnimatedLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.classList.add("logo-animate");
    }
  }, []);

  // Four teardrop loops forming crossed figure-eights
  // Each loop: starts at center, curves out into a rounded teardrop, returns to center
  const cx = 50, cy = 50;

  // Top loop — goes upward
  const topLoop = `M ${cx},${cy} C ${cx - 18},${cy - 12} ${cx - 22},${cy - 38} ${cx},${cy - 42} C ${cx + 22},${cy - 38} ${cx + 18},${cy - 12} ${cx},${cy}`;
  // Bottom loop — goes downward
  const bottomLoop = `M ${cx},${cy} C ${cx + 18},${cy + 12} ${cx + 22},${cy + 38} ${cx},${cy + 42} C ${cx - 22},${cy + 38} ${cx - 18},${cy + 12} ${cx},${cy}`;
  // Right loop — goes right
  const rightLoop = `M ${cx},${cy} C ${cx + 12},${cy - 18} ${cx + 38},${cy - 22} ${cx + 42},${cy} C ${cx + 38},${cy + 22} ${cx + 12},${cy + 18} ${cx},${cy}`;
  // Left loop — goes left
  const leftLoop = `M ${cx},${cy} C ${cx - 12},${cy + 18} ${cx - 38},${cy + 22} ${cx - 42},${cy} C ${cx - 38},${cy - 22} ${cx - 12},${cy - 18} ${cx},${cy}`;

  const loops = [
    { d: topLoop, delay: 0 },
    { d: rightLoop, delay: 0.4 },
    { d: bottomLoop, delay: 0.8 },
    { d: leftLoop, delay: 1.2 },
  ];

  const pathLength = 300;

  return (
    <>
      <style>{`
        .logo-animate .logo-loop {
          stroke-dasharray: ${pathLength};
          stroke-dashoffset: ${pathLength};
        }
        ${loops.map((_, i) => `
        .logo-animate .logo-loop-${i} {
          animation: logo-draw 0.7s ease-out ${loops[i].delay}s forwards;
        }`).join("")}
        @keyframes logo-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fbs-logo-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#89B4D8" />
            <stop offset="45%" stopColor="#D4B896" />
            <stop offset="100%" stopColor="#F0A500" />
          </linearGradient>
        </defs>
        {loops.map((loop, i) => (
          <path
            key={i}
            d={loop.d}
            className={`logo-loop logo-loop-${i}`}
            stroke="url(#fbs-logo-gradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>
    </>
  );
}
