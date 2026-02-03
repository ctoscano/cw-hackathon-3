"use client";

import { useState } from "react";
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
            Noticing that balance is slipping before things reach a crisis point shows real
            self-awareness — that&apos;s actually when a lot of people find it most helpful to pause
            and explore what&apos;s going on.
          </ChatMessage>
          <ChatMessage type="reflection">
            It makes sense that these areas feel connected — they often influence each other in ways
            that aren&apos;t always obvious at first.
          </ChatMessage>
        </div>
      </section>

      {/* Section: Loading State */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Loading State (Reflection Pending)</h2>
        <p className={styles.sectionDescription}>
          While waiting for the LLM response, the reflection bubble shows a typing indicator.
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
            Feeling stuck while knowing something needs to change is a really common experience —
            and the fact that you&apos;re noticing how it&apos;s affecting different parts of your
            life suggests you&apos;re ready to look at it more closely.
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

      {/* Section: Optimistic UI Demo */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Optimistic UI Pattern</h2>
        <p className={styles.sectionDescription}>
          When users submit an answer, their response appears immediately while the reflection
          loads. This dramatically improves perceived performance.
        </p>
        <div className={styles.stateComparison}>
          <div className={styles.stateColumn}>
            <h3>Before (waiting)</h3>
            <div className={styles.stateBadge} data-state="waiting">
              User waits 1-3s
            </div>
            <p>User sees &quot;Processing...&quot; button with no visual progress.</p>
          </div>
          <div className={styles.stateColumn}>
            <h3>After (optimistic)</h3>
            <div className={styles.stateBadge} data-state="instant">
              Instant feedback
            </div>
            <p>
              User sees their answer immediately + typing indicator. Feels like natural
              conversation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
