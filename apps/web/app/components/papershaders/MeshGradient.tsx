"use client";

import { MeshGradient as PSMeshGradient } from "@paper-design/shaders-react";

interface MeshGradientProps {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  grainMixer?: number;
  grainOverlay?: number;
  speed?: number;
}

export default function MeshGradient({
  colors = ["#5100ff", "#00ff80", "#ffcc00", "#ea00ff"],
  distortion = 1,
  swirl = 0.8,
  grainMixer = 0,
  grainOverlay = 0,
  speed = 0.2,
}: MeshGradientProps) {
  return (
    <PSMeshGradient
      colors={colors}
      distortion={distortion}
      swirl={swirl}
      grainMixer={grainMixer}
      grainOverlay={grainOverlay}
      speed={speed}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
