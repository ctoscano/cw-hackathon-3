"use client";

import { BackgroundCanvas, CanyonLandscape } from "../../components/webgl";

// Desert canyon warm gradient fallback
const canyonFallback = `linear-gradient(
  to bottom,
  #5588bb 0%,
  #88aacc 20%,
  #ccbb99 40%,
  #cc9966 60%,
  #aa6644 75%,
  #884433 90%,
  #442211 100%
)`;

export default function CanyonPage() {
  return (
    <>
      <BackgroundCanvas fallbackGradient={canyonFallback}>
        <CanyonLandscape />
      </BackgroundCanvas>
      <main className="landscape-content">
        <div className="hero">
          <h1>Desert Canyon</h1>
          <p className="hero-subtitle">
            Ancient mesas rise from the desert floor, their layered rock faces telling stories of
            millennia beneath a blazing sky.
          </p>
          <div className="hero-details">
            <span className="detail-tag">Splat Texturing</span>
            <span className="detail-tag">Procedural Materials</span>
            <span className="detail-tag">Heat Shimmer</span>
          </div>
        </div>
        <section className="info-section">
          <h2>About This Scene</h2>
          <p>
            This shader demonstrates splat-based terrain blending, a technique commonly used in game
            engines to create realistic landscapes. Different terrain types (rock, sand, vegetation)
            are procedurally blended based on height and slope.
          </p>
          <h3>Technical Details</h3>
          <ul>
            <li>Splat map terrain blending (rock, sand, vegetation)</li>
            <li>Procedural heightmap with mesa formations</li>
            <li>Stratified rock texture with sedimentary layers</li>
            <li>Sand ripple patterns on desert floor</li>
            <li>Heat shimmer effect near ground</li>
            <li>Atmospheric dust particles</li>
            <li>5 parallax canyon layers</li>
          </ul>
        </section>
      </main>
    </>
  );
}
