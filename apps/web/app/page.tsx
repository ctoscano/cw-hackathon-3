import Link from "next/link";

const landscapes = [
  {
    slug: "mountain",
    title: "Mountain Serenity",
    description: "Layered peaks fading into misty distance under a starlit sky",
    color: "#1a1a2e",
    accentColor: "#533483",
  },
  {
    slug: "ocean",
    title: "Ocean Sunset",
    description: "Gentle waves catching golden light as the sun dips below the horizon",
    color: "#2c3e50",
    accentColor: "#ff6b6b",
  },
  {
    slug: "forest",
    title: "Misty Forest",
    description: "Ancient trees standing sentinel in ethereal morning mist",
    color: "#1a252f",
    accentColor: "#f39c12",
  },
  {
    slug: "canyon",
    title: "Desert Canyon",
    description: "Layered mesa silhouettes rising from sun-baked desert floor",
    color: "#2a1a12",
    accentColor: "#cc8844",
  },
  {
    slug: "aurora",
    title: "Aurora Borealis",
    description: "Dancing curtains of light illuminate the arctic night sky",
    color: "#040810",
    accentColor: "#22cc66",
  },
];

export default function HomePage() {
  return (
    <main className="home">
      <header className="home-header">
        <h1>WebGL Landscape Showcase</h1>
        <p className="home-subtitle">
          Explore peaceful, shader-based landscapes built with React Three Fiber. Each scene
          features procedural generation, parallax depth, and smooth animations.
        </p>
      </header>

      <section className="landscapes-grid">
        {landscapes.map((landscape) => (
          <Link
            key={landscape.slug}
            href={`/landscapes/${landscape.slug}`}
            className="landscape-card"
            style={
              {
                "--card-bg": landscape.color,
                "--card-accent": landscape.accentColor,
              } as React.CSSProperties
            }
          >
            <div className="card-content">
              <h2>{landscape.title}</h2>
              <p>{landscape.description}</p>
              <span className="card-cta">Explore →</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="home-info">
        <h2>About This Project</h2>
        <p>
          This showcase demonstrates performant WebGL backgrounds using React Three Fiber and GLSL
          shaders. All visuals are procedurally generated with no external textures, following
          Framer-inspired design principles.
        </p>
        <div className="features">
          <div className="feature">
            <h3>Performant</h3>
            <p>On-demand rendering, optimized shaders, minimal draw calls</p>
          </div>
          <div className="feature">
            <h3>Accessible</h3>
            <p>Respects reduced motion preferences, CSS fallbacks</p>
          </div>
          <div className="feature">
            <h3>Reusable</h3>
            <p>Component-based architecture for easy customization</p>
          </div>
        </div>
      </section>
    </main>
  );
}
