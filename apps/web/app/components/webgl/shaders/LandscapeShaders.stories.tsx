import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { AuroraLandscape } from "./AuroraLandscape";
import { CanyonLandscape } from "./CanyonLandscape";
import { ForestLandscape } from "./ForestLandscape";
import { MountainLandscape } from "./MountainLandscape";
import { OceanLandscape } from "./OceanLandscape";

// Wrapper that provides the R3F Canvas context for shaders
function ShaderCanvas({
  children,
  background = "#0a0a0a",
}: { children: ReactNode; background?: string }) {
  return (
    <div
      style={{
        width: "800px",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden",
        background,
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 45, position: [0, 0, 5] }}
      >
        {children}
      </Canvas>
    </div>
  );
}

// Meta for grouping all landscape shaders
const meta = {
  title: "WebGL/Landscape Shaders",
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0a" }] },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mountain: Story = {
  name: "Mountain Serenity",
  render: () => (
    <ShaderCanvas background="#1a1a2e">
      <MountainLandscape speed={0.3} />
    </ShaderCanvas>
  ),
};

export const Ocean: Story = {
  name: "Ocean Sunset",
  render: () => (
    <ShaderCanvas background="#2c3e50">
      <OceanLandscape speed={1.0} />
    </ShaderCanvas>
  ),
};

export const Forest: Story = {
  name: "Misty Forest",
  render: () => (
    <ShaderCanvas background="#1a252f">
      <ForestLandscape speed={0.3} />
    </ShaderCanvas>
  ),
};

export const Canyon: Story = {
  name: "Desert Canyon",
  render: () => (
    <ShaderCanvas background="#2a1a12">
      <CanyonLandscape speed={0.2} />
    </ShaderCanvas>
  ),
};

export const Aurora: Story = {
  name: "Aurora Borealis",
  render: () => (
    <ShaderCanvas background="#040810">
      <AuroraLandscape speed={0.25} />
    </ShaderCanvas>
  ),
};

export const AllLandscapes: Story = {
  name: "All Landscapes",
  decorators: [
    (Story) => (
      <div style={{ width: "900px" }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <div>
        <h3 style={{ color: "#fff", marginBottom: "8px", fontFamily: "sans-serif" }}>Mountain</h3>
        <div style={{ height: "250px", borderRadius: "8px", overflow: "hidden" }}>
          <Canvas
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <MountainLandscape speed={0.3} />
          </Canvas>
        </div>
      </div>
      <div>
        <h3 style={{ color: "#fff", marginBottom: "8px", fontFamily: "sans-serif" }}>Ocean</h3>
        <div style={{ height: "250px", borderRadius: "8px", overflow: "hidden" }}>
          <Canvas
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <OceanLandscape speed={1.0} />
          </Canvas>
        </div>
      </div>
      <div>
        <h3 style={{ color: "#fff", marginBottom: "8px", fontFamily: "sans-serif" }}>Forest</h3>
        <div style={{ height: "250px", borderRadius: "8px", overflow: "hidden" }}>
          <Canvas
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <ForestLandscape speed={0.3} />
          </Canvas>
        </div>
      </div>
      <div>
        <h3 style={{ color: "#fff", marginBottom: "8px", fontFamily: "sans-serif" }}>Canyon</h3>
        <div style={{ height: "250px", borderRadius: "8px", overflow: "hidden" }}>
          <Canvas
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <CanyonLandscape speed={0.2} />
          </Canvas>
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ color: "#fff", marginBottom: "8px", fontFamily: "sans-serif" }}>
          Aurora Borealis
        </h3>
        <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden" }}>
          <Canvas
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 45, position: [0, 0, 5] }}
          >
            <AuroraLandscape speed={0.25} />
          </Canvas>
        </div>
      </div>
    </div>
  ),
};
