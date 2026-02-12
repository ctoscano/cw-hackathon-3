"use client";

import { GodRays as PSGodRays } from "@paper-design/shaders-react";

interface GodRaysProps {
  colors?: string[];
  colorBack?: string;
  colorBloom?: string;
  intensity?: number;
  density?: number;
  spotty?: number;
  midSize?: number;
  midIntensity?: number;
  bloom?: number;
  speed?: number;
}

export default function GodRays({
  colors = ["#ffff00", "#ff6600", "#ff0000"],
  colorBack = "#000000",
  colorBloom = "#ffff00",
  intensity = 0.8,
  density = 0.6,
  spotty = 0.3,
  midSize = 0.4,
  midIntensity = 0.9,
  bloom = 0.5,
  speed = 0.1,
}: GodRaysProps) {
  return (
    <PSGodRays
      colors={colors}
      colorBack={colorBack}
      colorBloom={colorBloom}
      intensity={intensity}
      density={density}
      spotty={spotty}
      midSize={midSize}
      midIntensity={midIntensity}
      bloom={bloom}
      speed={speed}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
