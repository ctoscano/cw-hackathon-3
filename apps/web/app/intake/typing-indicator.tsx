"use client";

import styles from "./typing-indicator.module.css";

interface TypingIndicatorProps {
  className?: string;
}

/**
 * Animated typing indicator with three pulsing dots.
 * Used to show that a reflection is being generated.
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <output
      className={`${styles.container} ${className || ""}`}
      aria-label="Processing your response"
    >
      <svg className={styles.svg} viewBox="0 0 40 12" aria-hidden="true">
        <circle className={`${styles.dot} ${styles.dot1}`} cx="6" cy="6" r="4" />
        <circle className={`${styles.dot} ${styles.dot2}`} cx="20" cy="6" r="4" />
        <circle className={`${styles.dot} ${styles.dot3}`} cx="34" cy="6" r="4" />
      </svg>
    </output>
  );
}
