"use client";

import { BackgroundCanvas, OceanLandscape } from "../../components/webgl";

export default function OceanPage() {
  return (
    <>
      <BackgroundCanvas fallbackColor="#2c3e50">
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
