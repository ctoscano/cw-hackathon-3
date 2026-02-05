"use client";

import { TypingAnimation } from "@/components/ui/typing-animation";
import { TypingIndicator } from "@cw-hackathon/ui";
import type { ReactNode } from "react";

type MessageType = "question" | "answer" | "reflection";

interface ChatMessageProps {
  type: MessageType;
  children?: ReactNode;
  isLoading?: boolean;
  questionNumber?: number;
  animate?: boolean;
  typeAnimation?: boolean;
  loadingMessages?: string[];
}

/**
 * Chat-style message bubble component.
 *
 * - Questions: Left-aligned, muted background
 * - Answers: Right-aligned, primary gradient background
 * - Reflections: Left-aligned, secondary gradient, italic
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
      const messages = loadingMessages || ["Reflecting...", "Processing...", "Thinking..."];
      const longestMessage = messages.reduce((a, b) => (a.length > b.length ? a : b), "");
      const estimatedWidth = Math.max(longestMessage.length * 8, 120);

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

  // Base styles for all message bubbles
  const baseStyles = "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-snug";

  // Type-specific styles
  const typeStyles = {
    question: "bg-muted text-foreground rounded-bl-sm",
    answer:
      "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground rounded-br-sm",
    reflection:
      "bg-gradient-to-br from-secondary/10 to-primary/5 text-muted-foreground italic rounded-bl-sm border border-secondary/15",
  };

  // Animation styles
  const animationStyles = animate ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : "";

  // Loading state styles for reflection
  const loadingStyles = isLoading && type === "reflection" ? "min-h-[60px] flex items-center" : "";

  return (
    <div className={`flex w-full mb-3 ${isLeft ? "justify-start" : "justify-end"}`}>
      <div
        className={`${baseStyles} ${typeStyles[type]} ${animationStyles} ${loadingStyles}`}
        data-loading={isLoading ? "true" : undefined}
      >
        {type === "question" && questionNumber !== undefined && (
          <span className="text-secondary font-semibold mr-2">{questionNumber}.</span>
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
