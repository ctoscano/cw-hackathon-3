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
  fallbackColor?: string;
}

export function BackgroundCanvas({
  children,
  className = "",
  fallbackColor = "#0a0a0a",
}: BackgroundCanvasProps) {
  return (
    <div
      className={`background-canvas ${className}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundColor: fallbackColor,
      }}
    >
      <WebGLProvider>{children}</WebGLProvider>
    </div>
  );
}
