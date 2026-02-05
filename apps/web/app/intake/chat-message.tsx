"use client";

import { TypingAnimation } from "@/components/ui/typing-animation";
import type { ReactNode } from "react";
import styles from "./chat-message.module.css";
import { TypingIndicator } from "./typing-indicator";

type MessageType = "question" | "answer" | "reflection";

interface ChatMessageProps {
  type: MessageType;
  children?: ReactNode;
  isLoading?: boolean;
  questionNumber?: number;
  animate?: boolean;
  typeAnimation?: boolean; // Enable typing animation for content
  loadingMessages?: string[]; // Context-aware messages for loading state
}

/**
 * Chat-style message bubble component.
 *
 * - Questions: Left-aligned, gray background
 * - Answers: Right-aligned, blue background
 * - Reflections: Left-aligned, gradient blue, italic
 */
export function ChatMessage({
  type,
  children,
  isLoading = false,
  questionNumber,
  animate = false,
  typeAnimation = false,
  loadingMessages,
}: ChatMessageProps) {
  const isLeft = type === "question" || type === "reflection";

  // Render content with optional typing animation
  const renderContent = () => {
    if (isLoading && type === "reflection") {
      // Show rotating words for reflection loading
      // Use context-aware messages if provided, otherwise use defaults
      const messages = loadingMessages || ["Reflecting...", "Processing...", "Thinking..."];

      // Calculate min width based on longest message to prevent box from growing/shrinking
      // Approximate: ~8px per character (accounting for varying character widths)
      const longestMessage = messages.reduce((a, b) => (a.length > b.length ? a : b), "");
      const estimatedWidth = Math.max(longestMessage.length * 8, 120);

      // Wrap in container to prevent width/height jitter during animation
      return (
        <span style={{ display: "inline-block", minWidth: `${estimatedWidth}px` }}>
          <TypingAnimation words={messages} loop duration={80} showCursor={false} />
        </span>
      );
    }

    if (isLoading) {
      return <TypingIndicator />;
    }

    return children;
  };

  return (
    <div
      className={`${styles.messageRow} ${isLeft ? styles.messageRowLeft : styles.messageRowRight}`}
    >
      <div
        className={`
          ${styles.messageBubble}
          ${styles[`${type}Bubble`]}
          ${animate ? styles.animate : ""}
        `}
        data-loading={isLoading ? "true" : undefined}
      >
        {type === "question" && questionNumber !== undefined && (
          <span className={styles.questionNumber}>{questionNumber}.</span>
        )}
        {renderContent()}
      </div>
    </div>
  );
}

/**
 * Formats an answer for display in a chat bubble.
 */
export function formatAnswerForDisplay(answer: string | string[]): string {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  return answer;
}
