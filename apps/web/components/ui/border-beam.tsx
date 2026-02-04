"use client";

import { cn } from "@/lib/utils";
import { type MotionStyle, type Transition, motion } from "motion/react";

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number;
  /**
   * The duration of the border beam.
   */
  duration?: number;
  /**
   * The delay of the border beam.
   */
  delay?: number;
  /**
   * The color of the border beam from.
   */
  colorFrom?: string;
  /**
   * The color of the border beam to.
   */
  colorTo?: string;
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition;
  /**
   * The class name of the border beam.
   */
  className?: string;
  /**
   * The style of the border beam.
   */
  style?: React.CSSProperties;
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean;
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number;
  /**
   * The border width of the beam.
   */
  borderWidth?: number;
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5, // Increased default slightly for visibility
}: BorderBeamProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent",
        className,
      )}
      style={{
        borderWidth: borderWidth,
        // Mask to only show the border area
        maskClip: "padding-box, border-box",
        maskComposite: "intersect",
        maskImage: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        // Webkit prefix for compatibility (Chrome, Safari, Edge)
        WebkitMaskClip: "padding-box, border-box",
        WebkitMaskComposite: "source-in", // 'source-in' is roughly equivalent to 'intersect' for this use case in Webkit? actually 'xor' is commonly used for borders but here we want intersection of two masks?
        // Wait, the standard "border mask" technique usually uses 'exclude' (xor) with content-box vs border-box.
        // But the Magic UI implementation specifically used `mask-intersect` (composite: intersect).
        // Let's stick to the Magic UI logic but with prefixes.
        // For WebKit, `destination-in` or just standard `mask-composite` might vary.
        // Safest is standard syntax + Webkit prefix.
        WebkitMaskImage: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        ...style,
      }}
    >
      <motion.div
        className={cn(
          "absolute aspect-square bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};
