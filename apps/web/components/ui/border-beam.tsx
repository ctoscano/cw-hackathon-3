"use client";

/**
 * BorderBeam component - creates an animated gradient border effect
 * Uses CSS animations and conic gradients for a smooth rotating beam
 */

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  size = 250,
  duration = 12,
  delay = 0,
  colorFrom = "#4a90d9",
  colorTo = "#9c40ff",
  borderWidth = 2,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        borderRadius: "inherit",
        padding: `${borderWidth}px`,
        background: `conic-gradient(
          from 0deg,
          transparent 0%,
          transparent 30%,
          ${colorFrom} 50%,
          ${colorTo} 70%,
          transparent 90%,
          transparent 100%
        )`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        animation: `border-beam-spin ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <style jsx>{`
        @keyframes border-beam-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
