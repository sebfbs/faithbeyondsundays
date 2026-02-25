import { useEffect, useRef } from "react";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export default function AnimatedLogo({ size = 64, className = "" }: AnimatedLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Trigger animation on mount by toggling a class
    const svg = svgRef.current;
    if (svg) {
      svg.classList.add("logo-animate");
    }
  }, []);

  // The FBS logo: four petal loops forming a figure-eight cross
  // Each petal is a cubic bezier loop from center, out, and back
  const cx = 50, cy = 50;
  const r = 22; // radius of each petal
  const cp = 18; // control point spread

  // Right petal: center → right loop → back to center
  const rightPetal = `M ${cx},${cy} C ${cx + cp},${cy - cp} ${cx + r + cp},${cy - cp} ${cx + r},${cy} C ${cx + r + cp},${cy + cp} ${cx + cp},${cy + cp} ${cx},${cy}`;
  // Left petal
  const leftPetal = `M ${cx},${cy} C ${cx - cp},${cy + cp} ${cx - r - cp},${cy + cp} ${cx - r},${cy} C ${cx - r - cp},${cy - cp} ${cx - cp},${cy - cp} ${cx},${cy}`;
  // Top petal
  const topPetal = `M ${cx},${cy} C ${cx - cp},${cy - cp} ${cx - cp},${cy - r - cp} ${cx},${cy - r} C ${cx + cp},${cy - r - cp} ${cx + cp},${cy - cp} ${cx},${cy}`;
  // Bottom petal
  const bottomPetal = `M ${cx},${cy} C ${cx + cp},${cy + cp} ${cx + cp},${cy + r + cp} ${cx},${cy + r} C ${cx - cp},${cy + r + cp} ${cx - cp},${cy + cp} ${cx},${cy}`;

  const petals = [
    { d: rightPetal, delay: "0s" },
    { d: leftPetal, delay: "0.5s" },
    { d: topPetal, delay: "1s" },
    { d: bottomPetal, delay: "1.5s" },
  ];

  const pathLength = 200; // approximate

  return (
    <>
      <style>{`
        .logo-animate .logo-petal {
          stroke-dasharray: ${pathLength};
          stroke-dashoffset: ${pathLength};
          fill-opacity: 0;
        }
        .logo-animate .logo-petal-0 {
          animation: logo-draw 0.6s ease-out 0s forwards, logo-fill 0.4s ease-out 0.5s forwards;
        }
        .logo-animate .logo-petal-1 {
          animation: logo-draw 0.6s ease-out 0.5s forwards, logo-fill 0.4s ease-out 1s forwards;
        }
        .logo-animate .logo-petal-2 {
          animation: logo-draw 0.6s ease-out 1s forwards, logo-fill 0.4s ease-out 1.5s forwards;
        }
        .logo-animate .logo-petal-3 {
          animation: logo-draw 0.6s ease-out 1.5s forwards, logo-fill 0.4s ease-out 2s forwards;
        }
        @keyframes logo-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes logo-fill {
          to {
            fill-opacity: 1;
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
          <linearGradient id="fbs-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(215, 65%, 55%)" />
            <stop offset="100%" stopColor="hsl(38, 100%, 50%)" />
          </linearGradient>
        </defs>
        {petals.map((petal, i) => (
          <path
            key={i}
            d={petal.d}
            className={`logo-petal logo-petal-${i}`}
            stroke="url(#fbs-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="url(#fbs-gradient)"
          />
        ))}
      </svg>
    </>
  );
}
