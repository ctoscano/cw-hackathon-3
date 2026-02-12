"use client";

import { BackgroundCanvas, ForestLandscape } from "../../components/webgl";

// Morning forest scene fallback gradient
const forestFallback = `linear-gradient(
  to bottom,
  #a7c4d9 0%,
  #d4b896 20%,
  #e8c9a0 35%,
  #f0d8a8 45%,
  #c9d4a8 55%,
  #8aaa88 65%,
  #5a7a68 75%,
  #3a5a48 85%,
  #1a3a28 95%,
  #0a2018 100%
)`;

export default function ForestPage() {
  return (
    <>
      <BackgroundCanvas fallbackGradient={forestFallback}>
        <ForestLandscape />
      </BackgroundCanvas>
      <main className="landscape-content">
        <div className="hero">
          <h1>Misty Forest</h1>
          <p className="hero-subtitle">
            Ancient trees stand sentinel in the morning mist, their silhouettes layered in ethereal
            depths of amber and green.
          </p>
          <div className="hero-details">
            <span className="detail-tag">Atmospheric</span>
            <span className="detail-tag">Layered Depth</span>
            <span className="detail-tag">Morning Mist</span>
          </div>
        </div>
        <section className="info-section">
          <h2>About This Scene</h2>
          <p>
            This shader creates a layered forest scene with procedurally generated pine trees at
            multiple depths. Animated mist layers weave between the trees, creating an atmospheric,
            dreamlike quality.
          </p>
          <h3>Technical Details</h3>
          <ul>
            <li>Procedural tree generation</li>
            <li>3 forest depth layers</li>
            <li>Animated mist with noise</li>
            <li>Flying birds animation</li>
            <li>Subtle vignette effect</li>
          </ul>
        </section>
      </main>
    </>
  );
}
