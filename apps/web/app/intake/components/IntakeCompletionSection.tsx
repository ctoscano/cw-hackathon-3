/**
 * Completion section component for displaying results and optional contact form
 */

import { trackChatGPTClick } from "@/actions/intake";
import { BorderBeam } from "@/components/ui/border-beam";
import { Markdown } from "@/components/ui/markdown";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { createExperimentPrompt, generateChatGPTUrl } from "@/lib/chatgpt";
import styles from "../intake.module.css";
import type { IntakeStepResponse } from "../types";
import { IntakeContactForm } from "./IntakeContactForm";

interface IntakeCompletionSectionProps {
  status: "waiting" | "ready";
  outputs: IntakeStepResponse["completionOutputs"];
  sessionId: string | null;
}

export function IntakeCompletionSection({
  status,
  outputs,
  sessionId,
}: IntakeCompletionSectionProps) {
  // Handle ChatGPT button click - track interaction
  const handleChatGPTClick = () => {
    if (sessionId) {
      trackChatGPTClick(sessionId).catch((err) => {
        console.error("Failed to track ChatGPT click:", err);
        // Don't block navigation on tracking failure
      });
    }
  };

  // Waiting state - show loading animation with optional contact form
  if (status === "waiting") {
    return (
      <div className={styles.completionWaiting}>
        <div className={styles.completionWaitingCard}>
          <BorderBeam size={250} duration={12} delay={0} />
          <TypingAnimation
            words={["Gathering insights ✨", "Personalizing results 🎯", "Almost ready 🚀"]}
            loop
            className={styles.completionWaitingText}
            duration={80}
            showCursor={false}
          />

          {/* Optional Contact Info Collection */}
          <IntakeContactForm variant="waiting" sessionId={sessionId} />
        </div>
      </div>
    );
  }

  // Ready state - show completion outputs
  if (status === "ready" && outputs) {
    return (
      <div className={styles.completion}>
        {/* Contact form - shown above title */}
        <IntakeContactForm variant="afterResults" sessionId={sessionId} />

        <h2 className={styles.completionTitle}>Your Personalized Results</h2>

        <section className={styles.completionSection}>
          <h3>How Therapy Might Help</h3>
          <div className={styles.completionContent}>
            <Markdown>{outputs.personalizedBrief}</Markdown>
          </div>
        </section>

        <section className={styles.completionSection}>
          <h3>Making the Most of Your First Session</h3>
          <div className={styles.completionContent}>
            <Markdown>{outputs.firstSessionGuide}</Markdown>
          </div>
        </section>

        <section className={styles.completionSection}>
          <h3>Optional Pre-Therapy Experiments</h3>
          <p className={styles.experimentsIntro}>
            These are optional activities you might try before or between your first sessions.
            They&apos;re designed to give you useful insights, not assignments to complete.
          </p>
          <div className={styles.experiments}>
            {outputs.experiments.map((experiment, i) => {
              const isFirst = i === 0;
              const chatGptPrompt = isFirst ? createExperimentPrompt(experiment) : null;
              const chatGptUrl = chatGptPrompt ? generateChatGPTUrl(chatGptPrompt) : null;

              return (
                <div key={experiment.slice(0, 50)} className={styles.experiment}>
                  <span className={styles.experimentNumber}>{i + 1}</span>
                  <div className={styles.experimentContent}>
                    <Markdown>{experiment}</Markdown>
                    {chatGptUrl && (
                      <a
                        href={chatGptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.chatGptButton}
                        onClick={handleChatGPTClick}
                      >
                        Explore this with ChatGPT →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className={styles.completionFooter}>
          <p>
            This exploration is educational and does not replace professional advice. If you&apos;re
            ready to try therapy, we hope these insights help you find a good fit.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
