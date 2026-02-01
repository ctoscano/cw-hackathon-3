"use client";

import { BackgroundCanvas, MountainLandscape } from "../../components/webgl";

export default function MountainPage() {
  return (
    <>
      <BackgroundCanvas fallbackColor="#1a1a2e">
        <MountainLandscape />
      </BackgroundCanvas>
      <main className="landscape-content">
        <div className="hero">
          <h1>Mountain Serenity</h1>
          <p className="hero-subtitle">
            Layered peaks fade into the misty distance, their silhouettes dancing slowly against a
            starlit sky.
          </p>
          <div className="hero-details">
            <span className="detail-tag">Peaceful</span>
            <span className="detail-tag">Parallax Layers</span>
            <span className="detail-tag">Night Sky</span>
          </div>
        </div>
        <section className="info-section">
          <h2>About This Scene</h2>
          <p>
            This shader creates multiple layers of procedurally generated mountains using Fractional
            Brownian Motion (FBM) noise. Each layer moves at a different speed, creating a parallax
            effect that adds depth to the scene.
          </p>
          <h3>Technical Details</h3>
          <ul>
            <li>4-octave FBM noise for natural mountain shapes</li>
            <li>3 parallax mountain layers</li>
            <li>Procedural star field</li>
            <li>Horizon glow effect</li>
            <li>Respects reduced motion preference</li>
          </ul>
        </section>
      </main>
    </>
  );
}
