"use client";

import { Swirl as PSSwirl } from "@paper-design/shaders-react";

interface SwirlProps {
  colors?: string[];
  colorBack?: string;
  bandCount?: number;
  twist?: number;
  center?: number;
  proportion?: number;
  softness?: number;
  noise?: number;
  noiseFrequency?: number;
  speed?: number;
}

export default function Swirl({
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1"],
  colorBack = "#000000",
  bandCount = 5,
  twist = 0.7,
  center = 0.3,
  proportion = 0.5,
  softness = 0.8,
  noise = 0.3,
  noiseFrequency = 0.5,
  speed = 0.2,
}: SwirlProps) {
  return (
    <PSSwirl
      colors={colors}
      colorBack={colorBack}
      bandCount={bandCount}
      twist={twist}
      center={center}
      proportion={proportion}
      softness={softness}
      noise={noise}
      noiseFrequency={noiseFrequency}
      speed={speed}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
