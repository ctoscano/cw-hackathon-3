"use client";

import { useState } from "react";
import styles from "./dap.module.css";

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

  async function copyToClipboard(text: string, type: "system" | "user" | "dap") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
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

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="session" className={styles.label}>
          Describe the therapy session:
        </label>
        <textarea
          id="session"
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I had my session today with a client who..."
          rows={8}
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={loading || input.trim().length < 50}
        >
          {loading ? "Generating..." : "Generate DAP Note"}
        </button>
        {input.trim().length > 0 && input.trim().length < 50 && (
          <p className={styles.hint}>
            Please provide more detail ({50 - input.trim().length} more characters)
          </p>
        )}
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          {result.mode === "prompt-only" ? (
            <>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <h2>System Prompt</h2>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(result.prompt.system, "system")}
                  >
                    {copied === "system" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className={styles.promptText}>{result.prompt.system}</pre>
              </div>

              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <h2>User Prompt</h2>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(result.prompt.user, "user")}
                  >
                    {copied === "user" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className={styles.promptText}>{result.prompt.user}</pre>
              </div>

              <div className={styles.resultSection}>
                <h2>Expected Output Schema</h2>
                <pre className={styles.schemaText}>{result.schema}</pre>
              </div>

              <p className={styles.instructions}>
                Copy the prompts above and paste into Claude to generate your DAP note.
              </p>
            </>
          ) : (
            <>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <h2>Generated DAP Note</h2>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(formatDAPNoteAsText(result), "dap")}
                  >
                    {copied === "dap" ? "Copied!" : "Copy Full Note"}
                  </button>
                </div>

                <h3>Data</h3>
                <div className={styles.dapSection}>
                  <h4>Subjective</h4>
                  <p>{result.dapNote.data.subjective}</p>
                </div>
                <div className={styles.dapSection}>
                  <h4>Objective</h4>
                  <p>{result.dapNote.data.objective}</p>
                </div>

                <h3>Assessment</h3>
                <div className={styles.dapSection}>
                  <h4>Clinical Impression</h4>
                  <p>{result.dapNote.assessment.clinicalImpression}</p>
                </div>
                <div className={styles.dapSection}>
                  <h4>Progress</h4>
                  <p>{result.dapNote.assessment.progress}</p>
                </div>
                <div className={styles.dapSection}>
                  <h4>Risk Assessment</h4>
                  <p>{result.dapNote.assessment.riskAssessment}</p>
                </div>

                <h3>Plan</h3>
                <div className={styles.dapSection}>
                  <h4>Interventions</h4>
                  <ul>
                    {result.dapNote.plan.interventions.map((intervention, i) => (
                      <li key={i}>{intervention}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.dapSection}>
                  <h4>Homework</h4>
                  <p>{result.dapNote.plan.homework}</p>
                </div>
                <div className={styles.dapSection}>
                  <h4>Next Session</h4>
                  <p>{result.dapNote.plan.nextSession}</p>
                </div>
                {result.dapNote.plan.referrals.length > 0 && (
                  <div className={styles.dapSection}>
                    <h4>Referrals</h4>
                    <ul>
                      {result.dapNote.plan.referrals.map((referral, i) => (
                        <li key={i}>{referral}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <h3>Metadata</h3>
                <div className={styles.dapSection}>
                  <p>
                    <strong>Session Date:</strong> {result.dapNote.metadata.sessionDate}
                  </p>
                  <p>
                    <strong>Duration:</strong> {result.dapNote.metadata.sessionDuration}
                  </p>
                  <p>
                    <strong>Type:</strong> {result.dapNote.metadata.sessionType}
                  </p>
                  <p>
                    <strong>Billing Code:</strong> {result.dapNote.metadata.billingCode}
                  </p>
                </div>

                {result.metadata && (
                  <div className={styles.dapSection}>
                    <p className={styles.apiMetadata}>
                      Generated using {result.metadata.model} •
                      {result.metadata.tokensUsed.totalTokens.toLocaleString()} tokens •
                      {result.metadata.executionTime}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
