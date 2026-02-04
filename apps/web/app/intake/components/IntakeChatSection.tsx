/**
 * Chat section component for displaying message history
 * Includes auto-scroll functionality
 */

import { useEffect, useRef } from "react";
import { ChatMessage, formatAnswerForDisplay } from "../chat-message";
import type { ChatMessageItem } from "../intake-utils";
import styles from "../intake.module.css";
import type { IntakeQuestion, IntakeState } from "../types";

interface IntakeChatSectionProps {
  messages: ChatMessageItem[];
  currentQuestion: IntakeQuestion | null;
  state: IntakeState;
  totalSteps: number;
}

export function IntakeChatSection({
  messages,
  currentQuestion,
  state,
  totalSteps,
}: IntakeChatSectionProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isGeneratingCompletion = state === "generating_completion";
  const isComplete = state === "complete";

  // Auto-scroll when messages change or reflection content loads
  useEffect(() => {
    // Small delay to let DOM update with new content height
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      {messages.map((msg) => {
        if (msg.type === "question") {
          // Only show as chat bubble if it's a past question (not the current active one)
          // Special case: When generating completion or complete, the last question should not be shown
          const isCurrentQuestion =
            currentQuestion &&
            msg.question.id === currentQuestion.id &&
            !isComplete &&
            !isGeneratingCompletion;

          const isLastQuestionDuringCompletion =
            (isGeneratingCompletion || isComplete) && msg.questionNumber === totalSteps;

          if (isCurrentQuestion || isLastQuestionDuringCompletion) return null;

          return (
            <ChatMessage key={msg.id} type="question" questionNumber={msg.questionNumber}>
              {msg.question.prompt}
            </ChatMessage>
          );
        }

        if (msg.type === "answer") {
          return (
            <ChatMessage key={msg.id} type="answer" animate>
              {formatAnswerForDisplay(msg.content)}
            </ChatMessage>
          );
        }

        if (msg.type === "reflection") {
          return (
            <ChatMessage key={msg.id} type="reflection" isLoading={msg.content === null || msg.content === ""}>
              {msg.content}
            </ChatMessage>
          );
        }

        return null;
      })}
      <div ref={chatEndRef} />
    </div>
  );
}
