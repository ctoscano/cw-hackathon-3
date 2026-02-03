"use client";

import type { ReactNode } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";
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
}: ChatMessageProps) {
  const isLeft = type === "question" || type === "reflection";

  // Render content with optional typing animation
  const renderContent = () => {
    if (isLoading) {
      return <TypingIndicator />;
    }

    if (typeAnimation && typeof children === "string") {
      return (
        <TypingAnimation
          duration={20}
          showCursor={false}
        >
          {children}
        </TypingAnimation>
      );
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
