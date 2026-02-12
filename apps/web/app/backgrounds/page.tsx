"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamic imports with ssr:false for all WebGL components
const RBAurora = dynamic(() => import("../components/reactbits/Aurora"), { ssr: false });
const RBLightning = dynamic(() => import("../components/reactbits/Lightning"), { ssr: false });
const RBWaves = dynamic(() => import("../components/reactbits/Waves"), { ssr: false });
const RBIridescence = dynamic(() => import("../components/reactbits/Iridescence"), { ssr: false });
const RBLiquidChrome = dynamic(() => import("../components/reactbits/LiquidChrome"), {
  ssr: false,
});
const RBParticles = dynamic(() => import("../components/reactbits/Particles"), { ssr: false });

// Paper Shaders - zero-dependency WebGL shader components
const PSNeuroNoise = dynamic(() => import("../components/papershaders/NeuroNoise"), { ssr: false });
const PSMeshGradient = dynamic(() => import("../components/papershaders/MeshGradient"), {
  ssr: false,
});
const PSGodRays = dynamic(() => import("../components/papershaders/GodRays"), { ssr: false });
const PSSmokeRing = dynamic(() => import("../components/papershaders/SmokeRing"), { ssr: false });
const PSSwirl = dynamic(() => import("../components/papershaders/Swirl"), { ssr: false });

interface BackgroundConfig {
  id: string;
  label: string;
  description: string;
  tags: string[];
  bgColor: string;
  source: "reactbits" | "paper-shaders";
  render: () => React.ReactNode;
}

const backgrounds: BackgroundConfig[] = [
  // --- ReactBits (OGL / Raw WebGL / Canvas 2D) ---
  {
    id: "aurora",
    label: "Aurora v2",
    description:
      "Vibrant northern lights using OGL with simplex noise and color ramp blending. Dramatically more vivid than the custom GLSL version.",
    tags: ["OGL", "Simplex Noise", "Color Ramp"],
    bgColor: "#000814",
    source: "reactbits",
    render: () => (
      <RBAurora
        colorStops={["#00D4FF", "#7CFF67", "#00D4FF"]}
        amplitude={1.2}
        blend={0.6}
        speed={1.5}
      />
    ),
  },
  {
    id: "aurora-warm",
    label: "Aurora Warm",
    description:
      "Warm variant with magenta-to-gold color stops. Same simplex noise engine, completely different mood.",
    tags: ["OGL", "Warm Palette", "Customizable"],
    bgColor: "#0a0008",
    source: "reactbits",
    render: () => (
      <RBAurora
        colorStops={["#FF2277", "#FF8844", "#FF2277"]}
        amplitude={1.5}
        blend={0.4}
        speed={1.0}
      />
    ),
  },
  {
    id: "iridescence",
    label: "Iridescence",
    description:
      "Mesmerizing iridescent surface with iterative trigonometric distortion. Mouse-reactive - move your cursor to explore.",
    tags: ["OGL", "Interactive", "Mouse Reactive"],
    bgColor: "#000000",
    source: "reactbits",
    render: () => <RBIridescence color={[1, 1, 1]} speed={1.0} amplitude={0.1} mouseReact />,
  },
  {
    id: "liquid-chrome",
    label: "Liquid Chrome",
    description:
      "Raymarched liquid metal surface with Fresnel reflections and iridescent highlights. Interactive ripples follow your cursor.",
    tags: ["OGL", "Raymarching", "Fresnel"],
    bgColor: "#0a0a0a",
    source: "reactbits",
    render: () => (
      <RBLiquidChrome
        baseColor={[0.1, 0.1, 0.1]}
        speed={0.3}
        amplitude={0.5}
        frequencyX={3}
        frequencyY={2}
        interactive
      />
    ),
  },
  {
    id: "particles",
    label: "Particles",
    description:
      "3D particle system with hover interaction. Particles scatter when you move your mouse over them. Additive blending for glow.",
    tags: ["OGL", "3D Points", "Hover Repulsion"],
    bgColor: "#050510",
    source: "reactbits",
    render: () => (
      <RBParticles
        particleCount={300}
        particleSpread={12}
        speed={0.15}
        particleColors={["#00D4FF", "#7CFF67", "#FF6B6B", "#FFD93D"]}
        moveParticlesOnHover
        particleBaseSize={80}
        sizeRandomness={1.2}
        cameraDistance={18}
        alphaParticles
      />
    ),
  },
  {
    id: "lightning",
    label: "Lightning",
    description:
      "Animated lightning bolt using FBM noise in raw WebGL. Zero dependencies. Branching bolts with flickering glow.",
    tags: ["Raw WebGL", "FBM", "Zero Deps"],
    bgColor: "#020208",
    source: "reactbits",
    render: () => <RBLightning hue={230} speed={1.2} intensity={1.0} size={1.0} />,
  },
  {
    id: "lightning-red",
    label: "Red Lightning",
    description: "Same lightning engine with a crimson hue. Intense electrical energy effect.",
    tags: ["Raw WebGL", "Red Variant", "Zero Deps"],
    bgColor: "#080202",
    source: "reactbits",
    render: () => <RBLightning hue={0} speed={1.5} intensity={1.2} size={1.2} />,
  },
  {
    id: "waves",
    label: "Waves",
    description:
      "Perlin noise-driven wave lines on Canvas 2D with physics-based cursor interaction. Lightweight and elegant.",
    tags: ["Canvas 2D", "Perlin Noise", "Cursor Physics"],
    bgColor: "#0a0a0a",
    source: "reactbits",
    render: () => (
      <RBWaves
        lineColor="rgba(255,255,255,0.25)"
        backgroundColor="#0a0a0a"
        waveSpeedX={0.0125}
        waveSpeedY={0.005}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.925}
        tension={0.005}
        maxCursorMove={120}
      />
    ),
  },
  // --- Paper Shaders (@paper-design/shaders-react) ---
  {
    id: "neuro-noise",
    label: "Neuro Noise",
    description:
      "Glowing web-like structure of fluid lines and soft intersections. Neural network-inspired organic patterns powered by Paper Shaders.",
    tags: ["Paper Shaders", "WebGL", "Neural Pattern"],
    bgColor: "#0a0010",
    source: "paper-shaders",
    render: () => (
      <PSNeuroNoise colorFront="#ff0080" colorMid="#7928ca" colorBack="#29b6f6" speed={0.3} />
    ),
  },
  {
    id: "neuro-noise-green",
    label: "Neuro Green",
    description: "Neuro Noise variant with emerald and cyan tones. Matrix-like organic neural web.",
    tags: ["Paper Shaders", "Green Variant", "Neural Pattern"],
    bgColor: "#000a08",
    source: "paper-shaders",
    render: () => (
      <PSNeuroNoise colorFront="#00ff80" colorMid="#00bcd4" colorBack="#4caf50" speed={0.2} />
    ),
  },
  {
    id: "mesh-gradient",
    label: "Mesh Gradient",
    description:
      "Flowing color spots moving along organic trajectories with noise distortion and vortex swirl. Up to 10 simultaneous color channels.",
    tags: ["Paper Shaders", "Gradient", "Multi-Color"],
    bgColor: "#0a0020",
    source: "paper-shaders",
    render: () => (
      <PSMeshGradient
        colors={["#5100ff", "#00ff80", "#ffcc00", "#ea00ff"]}
        distortion={1}
        swirl={0.8}
        speed={0.2}
      />
    ),
  },
  {
    id: "mesh-gradient-ocean",
    label: "Ocean Gradient",
    description:
      "Cool-toned mesh gradient variant with deep ocean blues and seafoam greens. Calming ambient backdrop.",
    tags: ["Paper Shaders", "Ocean Palette", "Gradient"],
    bgColor: "#000814",
    source: "paper-shaders",
    render: () => (
      <PSMeshGradient
        colors={["#0077b6", "#00b4d8", "#90e0ef", "#023e8a"]}
        distortion={0.8}
        swirl={0.6}
        grainMixer={0.1}
        speed={0.15}
      />
    ),
  },
  {
    id: "god-rays",
    label: "God Rays",
    description:
      "Volumetric rays of light radiating from center with bloom and glow. Dramatic, cinematic lighting effect.",
    tags: ["Paper Shaders", "Volumetric", "Bloom"],
    bgColor: "#000000",
    source: "paper-shaders",
    render: () => (
      <PSGodRays
        colors={["#ffff00", "#ff6600", "#ff0000"]}
        colorBack="#000000"
        colorBloom="#ffff00"
        intensity={0.8}
        density={0.6}
        spotty={0.3}
        bloom={0.5}
        speed={0.1}
      />
    ),
  },
  {
    id: "god-rays-blue",
    label: "Blue God Rays",
    description:
      "Cool-toned god rays with ethereal blue and purple light beams. Underwater or cosmic atmosphere.",
    tags: ["Paper Shaders", "Blue Variant", "Volumetric"],
    bgColor: "#000008",
    source: "paper-shaders",
    render: () => (
      <PSGodRays
        colors={["#00bfff", "#7c4dff", "#18ffff"]}
        colorBack="#000010"
        colorBloom="#4fc3f7"
        intensity={0.9}
        density={0.5}
        spotty={0.2}
        bloom={0.7}
        speed={0.08}
      />
    ),
  },
  {
    id: "smoke-ring",
    label: "Smoke Ring",
    description:
      "Radial multi-colored gradient with layered noise creating a smoky, gaseous ring. Configurable thickness, radius, and noise detail.",
    tags: ["Paper Shaders", "Radial", "Noise Layers"],
    bgColor: "#000000",
    source: "paper-shaders",
    render: () => (
      <PSSmokeRing
        colors={["#d2822d", "#0c3b7e", "#b31a57", "#37a066"]}
        colorBack="#000000"
        thickness={0.5}
        radius={0.5}
        noiseIterations={4}
        noiseScale={1}
        speed={0.2}
      />
    ),
  },
  {
    id: "swirl",
    label: "Swirl",
    description:
      "Animated bands of color twisting into spirals and circular patterns. Adjustable band count, twist strength, and noise distortion.",
    tags: ["Paper Shaders", "Spiral", "Color Bands"],
    bgColor: "#000000",
    source: "paper-shaders",
    render: () => (
      <PSSwirl
        colors={["#ff6b6b", "#4ecdc4", "#45b7d1", "#ffd93d"]}
        colorBack="#0a0a0a"
        bandCount={5}
        twist={0.7}
        softness={0.8}
        noise={0.3}
        speed={0.2}
      />
    ),
  },
];

const sourceLabel: Record<BackgroundConfig["source"], string> = {
  reactbits: "ReactBits",
  "paper-shaders": "Paper Shaders",
};

export default function BackgroundsDemoPage() {
  const [activeId, setActiveId] = useState(backgrounds[0].id);
  const active = backgrounds.find((b) => b.id === activeId) ?? backgrounds[0];

  // Group backgrounds by source for nav sections
  const groups = backgrounds.reduce<Record<string, BackgroundConfig[]>>((acc, bg) => {
    if (!acc[bg.source]) acc[bg.source] = [];
    acc[bg.source].push(bg);
    return acc;
  }, {});

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Background layer */}
      <div
        key={active.id}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: active.bgColor,
          zIndex: 0,
        }}
      >
        {active.render()}
      </div>

      {/* UI overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "none",
        }}
      >
        {/* Top bar - tabs */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "12px 16px",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            overflowX: "auto",
            pointerEvents: "auto",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "6px",
              textDecoration: "none",
              marginRight: "8px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Home
          </a>
          {Object.entries(groups).map(([source, items], gi) => (
            <span key={source} style={{ display: "contents" }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "0 8px",
                  fontFamily: "system-ui, sans-serif",
                  borderLeft: gi > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  marginLeft: gi > 0 ? "4px" : "0",
                }}
              >
                {sourceLabel[source as BackgroundConfig["source"]]}
              </span>
              {items.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setActiveId(bg.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor:
                      active.id === bg.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    background:
                      active.id === bg.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: active.id === bg.id ? "#fff" : "rgba(255,255,255,0.6)",
                    fontSize: "13px",
                    fontWeight: active.id === bg.id ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "system-ui, sans-serif",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {bg.label}
                </button>
              ))}
            </span>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom info panel */}
        <div
          style={{
            padding: "24px",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            pointerEvents: "auto",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {active.label}
              </h1>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background:
                    active.source === "paper-shaders"
                      ? "rgba(138,43,226,0.3)"
                      : "rgba(0,212,255,0.3)",
                  border: `1px solid ${active.source === "paper-shaders" ? "rgba(138,43,226,0.5)" : "rgba(0,212,255,0.5)"}`,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: active.source === "paper-shaders" ? "#d8b4fe" : "#67e8f9",
                  fontFamily: "system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {sourceLabel[active.source]}
              </span>
            </div>
            <p
              style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "16px",
                lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {active.description}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {active.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
