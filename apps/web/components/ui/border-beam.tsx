"use client";

import { useEffect, useState } from "react";

/**
 * BorderBeam component - creates an animated rotating gradient border
 * Uses a two-layer approach: outer gradient layer + inner solid layer
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
  duration = 8,
  delay = 0,
  colorFrom = "#4a90d9",
  colorTo = "#a78bfa",
  borderWidth = 3,
}: BorderBeamProps) {
  const [animationId, setAnimationId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate ID only on client to avoid hydration mismatch
    setAnimationId(`beam-${Math.random().toString(36).slice(2, 9)}`);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!animationId) return;

    const styleId = `border-beam-styles-${animationId}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes ${animationId}-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [animationId]);

  if (!mounted) {
    return null; // Don't render on server
  }

  return (
    <>
      {/* Rotating gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          padding: `${borderWidth}px`,
          background: `conic-gradient(
            from 90deg,
            transparent 0%,
            ${colorFrom} 20%,
            ${colorTo} 40%,
            transparent 60%,
            transparent 100%
          )`,
          animation: `${animationId}-spin ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          pointerEvents: "none",
          zIndex: -2,
        }}
      />
      {/* Inner layer to create border effect - inherits parent background */}
      <div
        style={{
          position: "absolute",
          inset: `${borderWidth}px`,
          borderRadius: "inherit",
          background: "inherit",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </>
  );
}
