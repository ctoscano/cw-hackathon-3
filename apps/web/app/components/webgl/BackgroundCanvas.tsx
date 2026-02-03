"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const WebGLProvider = dynamic(
  () => import("./WebGLProvider").then((m) => ({ default: m.WebGLProvider })),
  { ssr: false },
);

interface BackgroundCanvasProps {
  children: ReactNode;
  className?: string;
  /** Single color fallback */
  fallbackColor?: string;
  /** CSS gradient fallback (takes precedence over fallbackColor) */
  fallbackGradient?: string;
}

export function BackgroundCanvas({
  children,
  className = "",
  fallbackColor = "#0a0a0a",
  fallbackGradient,
}: BackgroundCanvasProps) {
  const backgroundStyle = fallbackGradient
    ? { background: fallbackGradient }
    : { backgroundColor: fallbackColor };

  return (
    <div
      className={`background-canvas ${className}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        ...backgroundStyle,
      }}
    >
      <WebGLProvider>{children}</WebGLProvider>
    </div>
  );
}
