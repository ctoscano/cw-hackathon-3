"use client";

import { BackgroundCanvas, OceanLandscape } from "../../components/webgl";

// Sunset ocean scene fallback gradient
const oceanFallback = `linear-gradient(
  to bottom,
  #1a2a4a 0%,
  #3a4a6a 15%,
  #6a5a7a 25%,
  #aa6a6a 35%,
  #da8a5a 45%,
  #eaa040 52%,
  #4a6a7a 55%,
  #3a5a6a 65%,
  #2a4a5a 80%,
  #1a3a4a 100%
)`;

export default function OceanPage() {
  return (
    <>
      <BackgroundCanvas fallbackGradient={oceanFallback}>
        <OceanLandscape />
      </BackgroundCanvas>
      <main className="landscape-content">
        <div className="hero">
          <h1>Ocean Sunset</h1>
          <p className="hero-subtitle">
            Gentle waves catch the golden light as the sun dips below the horizon, painting the sky
            in warm corals and teals.
          </p>
          <div className="hero-details">
            <span className="detail-tag">Warm Tones</span>
            <span className="detail-tag">Wave Motion</span>
            <span className="detail-tag">Sun Reflection</span>
          </div>
        </div>
        <section className="info-section">
          <h2>About This Scene</h2>
          <p>
            This shader simulates an ocean sunset with animated waves, sun reflection on the water,
            and distant silhouettes. Multiple sine waves combine to create natural-looking water
            movement.
          </p>
          <h3>Technical Details</h3>
          <ul>
            <li>Multi-frequency wave simulation</li>
            <li>Dynamic sun reflection path</li>
            <li>Procedural cloud layer</li>
            <li>Distant island silhouettes</li>
            <li>Smooth horizon blending</li>
          </ul>
        </section>
      </main>
    </>
  );
}
