"use client";

import { BackgroundCanvas, ForestLandscape } from "../../components/webgl";

export default function ForestPage() {
  return (
    <>
      <BackgroundCanvas fallbackColor="#1a252f">
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
