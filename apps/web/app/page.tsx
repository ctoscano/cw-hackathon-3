import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>CW Hackathon - Web App</h1>
      <p>Welcome to the hackathon project!</p>

      <nav style={{ marginTop: "2rem" }}>
        <h2>Explore</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1rem" }}>
            <Link
              href="/why-therapy"
              style={{
                display: "block",
                padding: "1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Why Therapy? (Voice Guided)
              <span
                style={{
                  display: "block",
                  fontWeight: "normal",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                Have a voice conversation to explore if therapy is right for you
              </span>
            </Link>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <Link
              href="/intake"
              style={{
                display: "block",
                padding: "1rem",
                background: "#4a90d9",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Therapy Readiness (Text-Based)
              <span
                style={{
                  display: "block",
                  fontWeight: "normal",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                Answer questions in a step-by-step guided intake form
              </span>
            </Link>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <Link
              href="/dap"
              style={{
                display: "block",
                padding: "1rem",
                background: "#38a169",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              DAP Notes Generator
              <span
                style={{
                  display: "block",
                  fontWeight: "normal",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                Generate therapy DAP notes from session descriptions
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
