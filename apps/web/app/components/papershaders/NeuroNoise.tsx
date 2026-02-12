"use client";

import { NeuroNoise as PSNeuroNoise } from "@paper-design/shaders-react";

interface NeuroNoiseProps {
  colorFront?: string;
  colorMid?: string;
  colorBack?: string;
  brightness?: number;
  contrast?: number;
  speed?: number;
}

export default function NeuroNoise({
  colorFront = "#ff0080",
  colorMid = "#7928ca",
  colorBack = "#29b6f6",
  brightness,
  contrast,
  speed = 0.3,
}: NeuroNoiseProps) {
  return (
    <PSNeuroNoise
      colorFront={colorFront}
      colorMid={colorMid}
      colorBack={colorBack}
      brightness={brightness}
      contrast={contrast}
      speed={speed}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
