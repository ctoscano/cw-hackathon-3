"use client";

import { useEffect, useState } from "react";

/**
 * BorderBeam component - creates an animated rotating gradient border
 * Uses conic-gradient with CSS animation for broad browser compatibility
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
  borderWidth = 2,
}: BorderBeamProps) {
  const [animationId] = useState(() => `beam-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    // Inject keyframes animation
    const styleId = `border-beam-keyframes-${animationId}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes ${animationId} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, [animationId]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: `${borderWidth}px`,
        background: `conic-gradient(
          from 90deg,
          transparent 0deg,
          ${colorFrom} 90deg,
          ${colorTo} 180deg,
          transparent 270deg,
          transparent 360deg
        )`,
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, " +
          "linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask:
          "linear-gradient(#fff 0 0) content-box, " +
          "linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        pointerEvents: "none",
        animation: `${animationId} ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}
