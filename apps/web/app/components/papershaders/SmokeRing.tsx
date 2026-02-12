"use client";

import { SmokeRing as PSSmokeRing } from "@paper-design/shaders-react";

interface SmokeRingProps {
  colors?: string[];
  colorBack?: string;
  thickness?: number;
  radius?: number;
  innerShape?: number;
  noiseIterations?: number;
  noiseScale?: number;
  speed?: number;
}

export default function SmokeRing({
  colors = ["#d2822d", "#0c3b7e", "#b31a57", "#37a066"],
  colorBack = "#000000",
  thickness = 0.5,
  radius = 0.5,
  innerShape = 0,
  noiseIterations = 4,
  noiseScale = 1,
  speed = 0.2,
}: SmokeRingProps) {
  return (
    <PSSmokeRing
      colors={colors}
      colorBack={colorBack}
      thickness={thickness}
      radius={radius}
      innerShape={innerShape}
      noiseIterations={noiseIterations}
      noiseScale={noiseScale}
      speed={speed}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
