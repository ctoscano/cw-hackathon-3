import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IntakeForm } from "./intake-form";

export const metadata: Metadata = {
  title: "Is Therapy Right for Me? | Clinical Workflow",
  description:
    "A guided exploration to help you understand if therapy might be helpful right now, and how to make the most of it if you decide to try.",
};

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true">&larr;</span>
            Back
          </Link>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Therapy Readiness
            </h1>
          </div>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Form Section */}
      <section className="mx-auto max-w-2xl px-6 py-8">
        <IntakeForm />
      </section>
    </main>
  );
}
