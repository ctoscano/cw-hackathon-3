"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Textarea,
} from "@cw-hackathon/ui";
import { useState } from "react";

interface PromptOnlyResponse {
  mode: "prompt-only";
  prompt: {
    system: string;
    user: string;
  };
  schema: string;
  metadata: {
    parts: string[];
    builtAt: string;
  };
  message: string;
}

interface GeneratedResponse {
  mode: "generated";
  dapNote: {
    data: {
      subjective: string;
      objective: string;
    };
    assessment: {
      clinicalImpression: string;
      progress: string;
      riskAssessment: string;
    };
    plan: {
      interventions: string[];
      homework: string;
      nextSession: string;
      referrals: string[];
    };
    metadata: {
      sessionDate: string;
      sessionDuration: string;
      sessionType: string;
      billingCode: string;
    };
  };
  metadata: {
    tokensUsed: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    executionTime: string;
    model: string;
    builtAt: string;
  };
}

type DAPResponse = PromptOnlyResponse | GeneratedResponse;

function CopyButton({
  text,
  label,
  copied,
  onCopy,
}: {
  text: string;
  label: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text).then(onCopy);
      }}
      className="text-xs"
    >
      {copied ? "Copied!" : label}
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DAPForm() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DAPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"system" | "user" | "dap" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/dap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionDescription: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(type: "system" | "user" | "dap") {
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDAPNoteAsText(response: GeneratedResponse): string {
    const { dapNote } = response;

    return `DAP NOTE
========

DATA
----

Subjective:
${dapNote.data.subjective}

Objective:
${dapNote.data.objective}


ASSESSMENT
----------

Clinical Impression:
${dapNote.assessment.clinicalImpression}

Progress:
${dapNote.assessment.progress}

Risk Assessment:
${dapNote.assessment.riskAssessment}


PLAN
----

Interventions:
${dapNote.plan.interventions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

Homework:
${dapNote.plan.homework}

Next Session:
${dapNote.plan.nextSession}
${dapNote.plan.referrals.length > 0 ? `\nReferrals:\n${dapNote.plan.referrals.map((r, idx) => `${idx + 1}. ${r}`).join("\n")}` : ""}`;
  }

  const charCount = input.trim().length;
  const minChars = 50;
  const isValid = charCount >= minChars;

  return (
    <div className="flex flex-col gap-8">
      {/* Input Form */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-heading">Session Description</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="session" className="text-sm font-medium text-muted-foreground">
                Describe your therapy session in detail:
              </label>
              <Textarea
                id="session"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I had my session today with a client who..."
                rows={8}
                disabled={loading}
                className="resize-y min-h-[180px] font-body text-[15px] leading-relaxed"
              />
              {charCount > 0 && !isValid && (
                <p className="text-sm text-muted-foreground">
                  Please provide more detail ({minChars - charCount} more characters needed)
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{charCount} characters</p>
              <Button type="submit" disabled={loading || !isValid} className="px-6">
                {loading ? "Generating..." : "Generate DAP Note"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {result.mode === "prompt-only" ? (
            <>
              {/* System Prompt Card */}
              <Card className="border-border/50">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 bg-muted/30">
                  <CardTitle className="text-base font-heading">System Prompt</CardTitle>
                  <CopyButton
                    text={result.prompt.system}
                    label="Copy"
                    copied={copied === "system"}
                    onCopy={() => handleCopy("system")}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words bg-muted/20 max-h-72 overflow-y-auto">
                    {result.prompt.system}
                  </pre>
                </CardContent>
              </Card>

              {/* User Prompt Card */}
              <Card className="border-border/50">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 bg-muted/30">
                  <CardTitle className="text-base font-heading">User Prompt</CardTitle>
                  <CopyButton
                    text={result.prompt.user}
                    label="Copy"
                    copied={copied === "user"}
                    onCopy={() => handleCopy("user")}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words bg-muted/20 max-h-72 overflow-y-auto">
                    {result.prompt.user}
                  </pre>
                </CardContent>
              </Card>

              {/* Schema Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 bg-muted/30">
                  <CardTitle className="text-base font-heading">Expected Output Schema</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground bg-muted/20">
                    {result.schema}
                  </pre>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-secondary-foreground">
                    Copy the prompts above and paste into Claude to generate your DAP note.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Generated DAP Note */}
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="flex-row items-center justify-between space-y-0 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label="checkmark">
                      ✓
                    </span>
                    <CardTitle className="text-lg font-heading">Generated DAP Note</CardTitle>
                  </div>
                  <CopyButton
                    text={formatDAPNoteAsText(result)}
                    label="Copy Full Note"
                    copied={copied === "dap"}
                    onCopy={() => handleCopy("dap")}
                  />
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/50">
                  {/* DATA Section */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <h3 className="font-heading font-semibold text-secondary">Data</h3>
                    </div>
                    <div className="space-y-4 pl-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Subjective</h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.data.subjective}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Objective</h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.data.objective}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ASSESSMENT Section */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <h3 className="font-heading font-semibold text-primary">Assessment</h3>
                    </div>
                    <div className="space-y-4 pl-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Clinical Impression
                        </h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.assessment.clinicalImpression}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Progress</h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.assessment.progress}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Risk Assessment
                        </h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.assessment.riskAssessment}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PLAN Section */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-accent" />
                      <h3 className="font-heading font-semibold text-accent">Plan</h3>
                    </div>
                    <div className="space-y-4 pl-5">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Interventions</h4>
                        <ul className="list-disc list-inside space-y-1 text-foreground">
                          {result.dapNote.plan.interventions.map((intervention) => (
                            <li key={intervention} className="leading-relaxed">
                              {intervention}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Homework</h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.plan.homework}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Next Session</h4>
                        <p className="text-foreground leading-relaxed">
                          {result.dapNote.plan.nextSession}
                        </p>
                      </div>
                      {result.dapNote.plan.referrals.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Referrals</h4>
                          <ul className="list-disc list-inside space-y-1 text-foreground">
                            {result.dapNote.plan.referrals.map((referral) => (
                              <li key={referral} className="leading-relaxed">
                                {referral}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="p-6 bg-muted/20">
                    <h3 className="font-heading font-semibold text-muted-foreground mb-4">
                      Session Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-sm font-medium">{result.dapNote.metadata.sessionDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">
                          {result.dapNote.metadata.sessionDuration}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm font-medium">{result.dapNote.metadata.sessionType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Billing Code</p>
                        <p className="text-sm font-medium">{result.dapNote.metadata.billingCode}</p>
                      </div>
                    </div>

                    {result.metadata && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground italic">
                          Generated using {result.metadata.model} •{" "}
                          {result.metadata.tokensUsed.totalTokens.toLocaleString()} tokens •{" "}
                          {result.metadata.executionTime}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
