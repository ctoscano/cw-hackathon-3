import { isFeatureEnabled } from "@/lib/feature-flags";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";

// Force dynamic rendering for all /ops routes
export const dynamic = "force-dynamic";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Feature flag check - block access in production unless explicitly enabled
  if (!isFeatureEnabled("ops_page")) {
    notFound();
  }

  return (
    <NuqsAdapter>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <header className="border-b-2 border-border bg-card pb-6 mb-10 -mx-8 px-8 -mt-8 pt-8 shadow-md">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
                Operations Dashboard
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                View archived intake sessions and DAP notes
              </p>
            </div>
          </header>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </div>
      </div>
    </NuqsAdapter>
  );
}
