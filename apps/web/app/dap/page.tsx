import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DAPForm } from "./dap-form";

export const metadata: Metadata = {
  title: "DAP Notes Generator | Clinical Workflow",
  description: "Transform therapy session notes into structured DAP format with AI assistance",
};

export default function DAPPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true">&larr;</span>
            Back
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-secondary" aria-hidden="true" />
            <h1 className="font-heading text-xl font-semibold text-foreground">DAP Notes</h1>
          </div>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
            Transform Sessions into Structured Notes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Describe your therapy session and receive a complete DAP note ready for your EHR.
            AI-powered clinical documentation that saves time while maintaining quality.
          </p>
        </div>

        {/* DAP Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-sm font-medium text-muted-foreground">
              <span className="font-bold text-secondary">D</span>ata
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              <span className="font-bold text-primary">A</span>ssessment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              <span className="font-bold text-accent">P</span>lan
            </span>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <DAPForm />
      </section>
    </main>
  );
}
