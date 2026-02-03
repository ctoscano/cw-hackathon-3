"use client";

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
}: ChatMessageProps) {
  const isLeft = type === "question" || type === "reflection";

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
        {isLoading ? <TypingIndicator /> : children}
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
