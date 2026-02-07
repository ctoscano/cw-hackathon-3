import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Landscape Showcase | CW Hackathon",
  description: "WebGL shader-based landscape backgrounds in a peaceful illustration style",
};

export default function LandscapesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landscapes-layout">
      <nav className="landscapes-nav">
        <Link href="/" className="nav-home">
          Home
        </Link>
        <div className="nav-links">
          <Link href="/landscapes/mountain">Mountain</Link>
          <Link href="/landscapes/ocean">Ocean</Link>
          <Link href="/landscapes/forest">Forest</Link>
          <Link href="/landscapes/canyon">Canyon</Link>
          <Link href="/landscapes/aurora">Aurora</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
