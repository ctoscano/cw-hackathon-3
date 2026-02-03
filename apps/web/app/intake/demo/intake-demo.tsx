"use client";

import { useState } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { ChatMessage, formatAnswerForDisplay } from "../chat-message";
import { TypingIndicator } from "../typing-indicator";
import styles from "./demo.module.css";

export function IntakeDemo() {
  const [showAnimations, setShowAnimations] = useState(true);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Intake UI Component Demo</h1>
      <p className={styles.subtitle}>
        Preview of chat-style components used in the therapy readiness intake flow.
      </p>

      {/* Animation Toggle */}
      <div className={styles.controls}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showAnimations}
            onChange={(e) => setShowAnimations(e.target.checked)}
          />
          <span>Enable animations</span>
        </label>
      </div>

      {/* Section: Typing Indicator */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typing Indicator</h2>
        <p className={styles.sectionDescription}>
          Animated SVG dots that pulse to indicate the system is generating a response.
        </p>
        <div className={styles.demo}>
          <div className={styles.demoItem}>
            <span className={styles.label}>Default</span>
            <div className={styles.indicatorWrapper}>
              <TypingIndicator />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Question Bubbles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Question Bubbles (Left-aligned)</h2>
        <p className={styles.sectionDescription}>
          Questions from the system appear on the left side, similar to received messages.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="question" questionNumber={1}>
            What&apos;s made you consider therapy at this point in your life?
          </ChatMessage>
          <ChatMessage type="question" questionNumber={2}>
            Which areas of your life feel most affected right now?
          </ChatMessage>
          <ChatMessage type="question" questionNumber={3}>
            When this issue shows up, what tends to happen for you?
          </ChatMessage>
        </div>
      </section>

      {/* Section: Answer Bubbles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Answer Bubbles (Right-aligned)</h2>
        <p className={styles.sectionDescription}>
          User answers appear on the right side, like sent messages.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="answer" animate={showAnimations}>
            I&apos;m working on a startup and having trouble balancing work and life. I&apos;m
            starting to worry about burnout.
          </ChatMessage>
          <ChatMessage type="answer" animate={showAnimations}>
            {formatAnswerForDisplay(["Work or career", "Relationships", "Stress or overwhelm"])}
          </ChatMessage>
          <ChatMessage type="answer" animate={showAnimations}>
            {formatAnswerForDisplay(["Structured and practical - clear strategies and homework"])}
          </ChatMessage>
        </div>
      </section>

      {/* Section: Reflection Bubbles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reflection Bubbles</h2>
        <p className={styles.sectionDescription}>
          Personalized reflections appear after each answer, showing empathetic acknowledgment.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="reflection">
            That shift from "more discipline" to "how do I make this sustainable" is something many
            high-performers eventually recognize.
          </ChatMessage>
          <ChatMessage type="reflection">
            The areas you're describing often connect in surprising ways.
          </ChatMessage>
        </div>
      </section>

      {/* Section: Loading State */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Loading State (Reflection Pending)</h2>
        <p className={styles.sectionDescription}>
          While waiting for the LLM response, the reflection bubble shows rotating animated words.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="reflection" isLoading>
            {null}
          </ChatMessage>
        </div>
      </section>

      {/* Section: Complete Conversation Flow */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Complete Conversation Flow</h2>
        <p className={styles.sectionDescription}>
          A full question → answer → reflection cycle demonstrating the chat experience.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="question" questionNumber={1}>
            What&apos;s made you consider therapy at this point in your life?
          </ChatMessage>
          <ChatMessage type="answer" animate={showAnimations}>
            I&apos;ve been feeling stuck in my career and it&apos;s affecting my mood and
            relationships. I keep putting off making changes.
          </ChatMessage>
          <ChatMessage type="reflection">
            Feeling stuck while knowing something needs to change is a really common experience.
          </ChatMessage>
          <ChatMessage type="question" questionNumber={2}>
            Which areas of your life feel most affected right now?
          </ChatMessage>
          <ChatMessage type="answer" animate={showAnimations}>
            {formatAnswerForDisplay([
              "Work or career",
              "Mood or motivation",
              "Identity or direction",
            ])}
          </ChatMessage>
          <ChatMessage type="reflection" isLoading>
            {null}
          </ChatMessage>
        </div>
      </section>

      {/* Section: Optimistic UI with Immediate Next Question */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Optimistic UI: Next Question Appears Immediately</h2>
        <p className={styles.sectionDescription}>
          When users submit an answer, the next question appears immediately — they can start
          reading or answering while the reflection loads in the background.
        </p>
        <div className={styles.chatDemo}>
          <ChatMessage type="question" questionNumber={3}>
            When this issue shows up, what tends to happen for you?
          </ChatMessage>
          <ChatMessage type="answer" animate={showAnimations}>
            I overthink decisions and end up avoiding them entirely.
          </ChatMessage>
          <ChatMessage type="reflection" isLoading>
            {null}
          </ChatMessage>
          <ChatMessage type="question" questionNumber={4}>
            What have you already tried to handle this on your own?
          </ChatMessage>
        </div>
        <p className={styles.sectionNote}>
          ↑ Notice: Question 4 is already visible while the reflection for Q3 is still loading. The
          user can start thinking about or answering Q4 immediately.
        </p>
      </section>

      {/* Section: Completion Waiting State */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Completion Waiting State (with Typing Animation)</h2>
        <p className={styles.sectionDescription}>
          After the final question, rotating animated messages appear while personalized results are
          generated.
        </p>
        <div className={styles.completionWaitingDemo}>
          <div className={styles.completionWaitingIcon}>
            <svg viewBox="0 0 100 100" className={styles.completionWaitingSvg} aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e8f4fd" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#4a90d9"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset="125.6"
                className={styles.completionWaitingCircle}
              />
            </svg>
          </div>
          {showAnimations ? (
            <TypingAnimation
              words={["Gathering insights ✨", "Personalizing results 🎯", "Almost ready 🚀"]}
              loop
              className={styles.completionWaitingText}
              duration={80}
              showCursor={false}
            />
          ) : (
            <p className={styles.completionWaitingText}>Gathering insights ✨</p>
          )}
        </div>
        <p className={styles.sectionNote}>
          Messages cycle through: &quot;Gathering insights ✨&quot; → &quot;Personalizing results
          🎯&quot; → &quot;Almost ready 🚀&quot;
        </p>
      </section>

      {/* Section: Optimistic UI Pattern Comparison */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Before vs After: Perceived Performance</h2>
        <p className={styles.sectionDescription}>
          The optimistic UI pattern dramatically reduces perceived wait time.
        </p>
        <div className={styles.stateComparison}>
          <div className={styles.stateColumn}>
            <h3>Before (blocking)</h3>
            <div className={styles.stateBadge} data-state="waiting">
              User waits 1-3s
            </div>
            <p>
              User clicks &quot;Continue&quot;, sees &quot;Processing...&quot;, waits for API, then
              sees answer + reflection + next question all at once.
            </p>
          </div>
          <div className={styles.stateColumn}>
            <h3>After (optimistic)</h3>
            <div className={styles.stateBadge} data-state="instant">
              Instant feedback
            </div>
            <p>
              User clicks &quot;Continue&quot;, immediately sees their answer + typing indicator +
              next question. Reflection fades in when ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
