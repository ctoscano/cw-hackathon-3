import type { Metadata } from "next";
import { IntakeDemo } from "./intake-demo";

export const metadata: Metadata = {
  title: "Intake UI Demo",
  description: "Demo of intake chat UI components in various states",
};

export default function IntakeDemoPage() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <IntakeDemo />
    </main>
  );
}
