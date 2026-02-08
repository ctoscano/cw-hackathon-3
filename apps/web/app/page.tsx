import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@cw-hackathon/ui";
import { ClipboardList, FileText } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Clinical Workflow Hackathon
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered tools for mental health professionals
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Intake Assessment Card */}
          <Link href="/intake" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardHeader>
                <div className="mb-2">
                  <ClipboardList className="h-10 w-10 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary">
                  Therapy Readiness Assessment
                </CardTitle>
                <CardDescription>
                  Interactive intake questionnaire with AI-powered reflections
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1">
                  <li>Conversational chat-style interface</li>
                  <li>Personalized reflections on responses</li>
                  <li>Tailored therapy recommendations</li>
                  <li>Optional contact collection</li>
                </ul>
                <div className="mt-4 font-medium text-primary group-hover:underline">
                  Start Assessment &rarr;
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* DAP Notes Card */}
          <Link href="/dap" className="group">
            <Card className="h-full transition-all hover:border-secondary hover:shadow-lg">
              <CardHeader>
                <div className="mb-2">
                  <FileText className="h-10 w-10 text-secondary" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl group-hover:text-secondary">
                  DAP Notes Generator
                </CardTitle>
                <CardDescription>
                  Transform session notes into structured DAP format
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1">
                  <li>Data, Assessment, Plan structure</li>
                  <li>AI-generated clinical documentation</li>
                  <li>Copy-ready for EHR systems</li>
                  <li>Prompt-only mode available</li>
                </ul>
                <div className="mt-4 font-medium text-secondary group-hover:underline">
                  Generate Notes &rarr;
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Operations Link */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Operations Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                View analytics, manage sessions, and monitor activity
              </p>
            </div>
            <Link
              href="/ops"
              className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted-foreground hover:text-background"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Landscapes Link */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                WebGL Landscape Showcase
              </h2>
              <p className="text-sm text-muted-foreground">
                Explore shader-based landscapes with procedural generation and parallax depth
              </p>
            </div>
            <Link
              href="/landscapes/aurora"
              className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted-foreground hover:text-background"
            >
              View Landscapes
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Tailwind CSS, and Claude</p>
          <p className="mt-1">
            <Link href="/intake/demo" className="hover:underline">
              View Component Demo
            </Link>
            {" | "}
            <Link href="/ops/demo" className="hover:underline">
              View Ops Demo
            </Link>
            {" | "}
            <Link href="/landscapes/aurora" className="hover:underline">
              View Landscapes
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
