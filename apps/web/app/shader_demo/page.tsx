"use client";

import { useState } from "react";
import {
  BackgroundCanvas,
  CanyonLandscape,
  ForestLandscape,
  MountainLandscape,
  OceanLandscape,
} from "../components/webgl";

type ShaderType = "mountain" | "ocean" | "forest" | "canyon" | "all";

const shaderInfo = {
  mountain: {
    name: "Mountain",
    description: "Raymarched 3D terrain with starry night sky, moon, and atmospheric fog",
    gradient:
      "linear-gradient(to bottom, #0a0a1a 0%, #1a1a3a 20%, #2a1a4a 40%, #1a2a4a 60%, #0f1f3f 75%, #0a1020 90%, #050510 100%)",
  },
  ocean: {
    name: "Ocean",
    description: "TDM Seascape-inspired waves with Fresnel reflections and height-traced water",
    gradient:
      "linear-gradient(to bottom, #1a2a4a 0%, #3a4a6a 15%, #6a5a7a 25%, #aa6a6a 35%, #da8a5a 45%, #eaa040 52%, #4a6a7a 55%, #3a5a6a 65%, #2a4a5a 80%, #1a3a4a 100%)",
  },
  forest: {
    name: "Forest",
    description: "Layered misty forest with volumetric god rays and animated fog",
    gradient:
      "linear-gradient(to bottom, #a7c4d9 0%, #d4b896 20%, #e8c9a0 35%, #f0d8a8 45%, #c9d4a8 55%, #8aaa88 65%, #5a7a68 75%, #3a5a48 85%, #1a3a28 95%, #0a2018 100%)",
  },
  canyon: {
    name: "Canyon",
    description: "Desert canyon with splat-based terrain blending, rock strata, and heat shimmer",
    gradient:
      "linear-gradient(to bottom, #5588bb 0%, #88aacc 20%, #ccbb99 40%, #cc9966 60%, #aa6644 75%, #884433 90%, #442211 100%)",
  },
};

export default function ShaderDemo() {
  const [activeShader, setActiveShader] = useState<ShaderType>("mountain");
  const [showInfo, setShowInfo] = useState(true);

  const renderShader = (type: ShaderType) => {
    switch (type) {
      case "mountain":
        return <MountainLandscape speed={0.5} />;
      case "ocean":
        return <OceanLandscape speed={1.0} />;
      case "forest":
        return <ForestLandscape speed={0.3} />;
      case "canyon":
        return <CanyonLandscape speed={0.2} />;
      default:
        return null;
    }
  };

  if (activeShader === "all") {
    return (
      <div style={{ minHeight: "100vh", background: "#000" }}>
        {/* Header */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(10px)",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#fff" }}>Shader Demo</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["mountain", "ocean", "forest", "canyon", "all"] as ShaderType[]).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setActiveShader(type)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: activeShader === type ? "#fff" : "rgba(255,255,255,0.2)",
                  color: activeShader === type ? "#000" : "#fff",
                  fontWeight: activeShader === type ? "bold" : "normal",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Grid view */}
        <div
          style={{
            paddingTop: "80px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "2px",
            background: "#111",
          }}
        >
          {(["mountain", "ocean", "forest", "canyon"] as const).map((type) => (
            <button
              type="button"
              key={type}
              style={{
                position: "relative",
                height: "50vh",
                minHeight: "300px",
                overflow: "hidden",
                cursor: "pointer",
                border: "none",
                padding: 0,
                background: "transparent",
                textAlign: "left",
              }}
              onClick={() => setActiveShader(type)}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: shaderInfo[type].gradient,
                }}
              >
                <BackgroundCanvas>{renderShader(type)}</BackgroundCanvas>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "2rem",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  color: "#fff",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{shaderInfo[type].name}</h2>
                <p style={{ margin: "0.5rem 0 0", opacity: 0.8, fontSize: "0.9rem" }}>
                  {shaderInfo[type].description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const info = shaderInfo[activeShader];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Full-screen shader */}
      <BackgroundCanvas fallbackGradient={info.gradient}>
        {renderShader(activeShader)}
      </BackgroundCanvas>

      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#fff" }}>Shader Demo</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["mountain", "ocean", "forest", "canyon", "all"] as ShaderType[]).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setActiveShader(type)}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: activeShader === type ? "#fff" : "rgba(255,255,255,0.2)",
                color: activeShader === type ? "#000" : "#fff",
                fontWeight: activeShader === type ? "bold" : "normal",
                textTransform: "capitalize",
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "2rem",
            right: "2rem",
            maxWidth: "500px",
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "1.5rem",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.75rem" }}>{info.name}</h2>
              <p style={{ margin: "0.75rem 0 0", opacity: 0.85, lineHeight: 1.5 }}>
                {info.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                opacity: 0.6,
                cursor: "pointer",
                fontSize: "1.5rem",
                padding: "0.25rem",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "999px",
                fontSize: "0.85rem",
              }}
            >
              WebGL 2.0
            </span>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "999px",
                fontSize: "0.85rem",
              }}
            >
              GLSL Shaders
            </span>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "999px",
                fontSize: "0.85rem",
              }}
            >
              React Three Fiber
            </span>
          </div>
        </div>
      )}

      {/* Show info button when hidden */}
      {!showInfo && (
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "2rem",
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.25rem",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Show Info
        </button>
      )}
    </div>
  );
}
