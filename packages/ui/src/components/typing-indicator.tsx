"use client";

import * as React from "react";
import { cn } from "../utils";

interface TypingIndicatorProps extends React.HTMLAttributes<HTMLOutputElement> {
  /** Size variant of the indicator */
  size?: "sm" | "md" | "lg";
  /** Color of the dots (CSS color value) */
  dotColor?: string;
}

/**
 * Animated typing indicator with three pulsing dots.
 * Used to show that a response is being generated.
 * Respects prefers-reduced-motion accessibility settings.
 */
const TypingIndicator = React.forwardRef<HTMLOutputElement, TypingIndicatorProps>(
  ({ className, size = "md", dotColor = "currentColor", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-10 h-4",
      md: "w-[60px] h-5",
      lg: "w-20 h-6",
    };

    const dotSizes = {
      sm: 4,
      md: 6,
      lg: 8,
    };

    const dotSize = dotSizes[size];
    const spacing = size === "sm" ? 8 : size === "md" ? 10 : 12;

    return (
      <output
        ref={ref}
        className={cn("inline-flex items-center justify-center px-3 py-2", className)}
        aria-label="Processing your response"
        {...props}
      >
        <svg
          className={cn(sizeClasses[size], "motion-safe:animate-none")}
          viewBox="0 0 60 20"
          aria-hidden="true"
        >
          <circle
            className="fill-current opacity-30 motion-safe:animate-[dotPulse_1.4s_ease-in-out_infinite]"
            cx={spacing}
            cy="10"
            r={dotSize}
            style={{ color: dotColor, animationDelay: "0s" }}
          />
          <circle
            className="fill-current opacity-30 motion-safe:animate-[dotPulse_1.4s_ease-in-out_infinite]"
            cx="30"
            cy="10"
            r={dotSize}
            style={{ color: dotColor, animationDelay: "0.2s" }}
          />
          <circle
            className="fill-current opacity-30 motion-safe:animate-[dotPulse_1.4s_ease-in-out_infinite]"
            cx={60 - spacing}
            cy="10"
            r={dotSize}
            style={{ color: dotColor, animationDelay: "0.4s" }}
          />
        </svg>
      </output>
    );
  },
);
TypingIndicator.displayName = "TypingIndicator";

export { TypingIndicator };
export type { TypingIndicatorProps };
