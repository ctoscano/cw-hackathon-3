"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { type ReactNode, Suspense } from "react";

interface WebGLProviderProps extends Partial<CanvasProps> {
  children: ReactNode;
}

export function WebGLProvider({ children, ...canvasProps }: WebGLProviderProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 45, position: [0, 0, 5] }}
      {...canvasProps}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
