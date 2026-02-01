"use client";

import { useState } from "react";
import styles from "./dap.module.css";

interface DAPResponse {
  mode: string;
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

export function DAPForm() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DAPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"system" | "user" | null>(null);

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

  async function copyToClipboard(text: string, type: "system" | "user") {
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
        </div>
      )}
    </div>
  );
}
