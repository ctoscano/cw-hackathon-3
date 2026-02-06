import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DAPFormDemo } from "./dap-form-demo";

export const metadata: Metadata = {
  title: "DAP Notes Demo | UI States",
  description: "Demo page showing all DAP form UI states",
};

export default function DAPDemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/dap"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true">&larr;</span>
            Back to DAP
          </Link>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <h1 className="font-heading text-xl font-semibold text-foreground">DAP Demo</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Description */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            UI State Demonstrations
          </h2>
          <p className="text-muted-foreground">Preview all form states without making API calls</p>
        </div>
      </section>

      {/* Demo Sections */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <DAPFormDemo />
      </section>
    </main>
  );
}
