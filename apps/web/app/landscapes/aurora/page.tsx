"use client";

import { AuroraLandscape, BackgroundCanvas } from "../../components/webgl";

// Dark arctic night sky fallback
const auroraFallback = `linear-gradient(
  to bottom,
  #020208 0%,
  #040410 15%,
  #0a1a2a 30%,
  #0c3828 45%,
  #082818 55%,
  #060e1a 70%,
  #040810 85%,
  #010204 100%
)`;

export default function AuroraPage() {
  return (
    <>
      <BackgroundCanvas fallbackGradient={auroraFallback}>
        <AuroraLandscape />
      </BackgroundCanvas>
      <main className="landscape-content">
        <div className="hero">
          <h1>Aurora Borealis</h1>
          <p className="hero-subtitle">
            Ethereal curtains of light dance across the arctic sky, painting the darkness with
            ribbons of green, cyan, and violet above silent, snow-capped peaks.
          </p>
          <div className="hero-details">
            <span className="detail-tag">Domain Warping</span>
            <span className="detail-tag">Procedural Stars</span>
            <span className="detail-tag">Light Curtains</span>
          </div>
        </div>
        <section className="info-section">
          <h2>About This Scene</h2>
          <p>
            This shader recreates the aurora borealis phenomenon using layered, domain-warped noise
            curtains. Each ribbon of light moves independently with organic flowing motion, while a
            procedural starfield twinkles behind the display.
          </p>
          <h3>Technical Details</h3>
          <ul>
            <li>Multiple aurora curtains with independent motion</li>
            <li>Domain-warped FBM for organic light ribbon shapes</li>
            <li>Procedural starfield with twinkling animation</li>
            <li>4 parallax snow mountain layers with snow caps</li>
            <li>Aurora reflection on frozen ground</li>
            <li>Atmospheric mist between mountain layers</li>
            <li>Cool-toned color grading and vignette</li>
          </ul>
        </section>
      </main>
    </>
  );
}
