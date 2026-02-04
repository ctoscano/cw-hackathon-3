"use client";

import { useState } from "react";
import { triggerConfetti } from "@/lib/confetti";
import { BorderBeam } from "@/components/ui/border-beam";
import { Markdown } from "@/components/ui/markdown";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { ChatMessage, formatAnswerForDisplay } from "../chat-message";
import { TypingIndicator } from "../typing-indicator";
import styles from "./demo.module.css";
import intakeStyles from "../intake.module.css";

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
        <h2 className={styles.sectionTitle}>Completion Waiting State (Border Beam Animation)</h2>
        <p className={styles.sectionDescription}>
          After the final question, an elegant border-beam animation and rotating messages appear
          while personalized results are generated. Uses Magic UI&apos;s border-beam for a polished,
          delightful experience.
        </p>
        <div className={styles.demo}>
          <div className={intakeStyles.completionWaiting}>
            <div className={intakeStyles.completionWaitingCard}>
              <BorderBeam size={250} duration={12} delay={0} />
              {showAnimations ? (
                <TypingAnimation
                  words={["Gathering insights ✨", "Personalizing results 🎯", "Almost ready 🚀"]}
                  loop
                  className={intakeStyles.completionWaitingText}
                  duration={80}
                  showCursor={false}
                />
              ) : (
                <p className={intakeStyles.completionWaitingText}>Gathering insights ✨</p>
              )}
            </div>
          </div>
        </div>
        <p className={styles.sectionNote}>
          Border beam animates around the card edge while messages cycle through. More elegant than a
          spinning circle.
        </p>
      </section>

      {/* Section: Contact Info Collection */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Optional Contact Info Collection (During Wait)</h2>
        <p className={styles.sectionDescription}>
          While results are generating, users can optionally share contact info to connect with a therapist.
          Completely skippable with warm, inviting copy - no pressure.
        </p>
        <div className={styles.demo}>
          <div className={intakeStyles.completionWaiting}>
            <div className={intakeStyles.completionWaitingCard}>
              <BorderBeam size={250} duration={12} delay={0} />
              <p className={intakeStyles.completionWaitingText}>Gathering insights ✨</p>

              <div className={intakeStyles.contactForm}>
                <p className={intakeStyles.contactFormText}>
                  Great! Share your email or phone number and we&apos;ll reach out to help you get started.
                </p>
                <div className={intakeStyles.contactInputs}>
                  <input
                    type="email"
                    placeholder="Email address (optional)"
                    className={intakeStyles.contactInput}
                    defaultValue="user@example.com"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    className={intakeStyles.contactInput}
                  />
                </div>
                <p className={intakeStyles.contactFormNote}>
                  You can skip this - your results will show below either way.
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.sectionNote}>
          Form appears after user clicks &quot;Yes, I&apos;d like that&quot; button. No backend integration
          (placeholder only). Emphasizes optional nature and shows results regardless.
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

      {/* Section: Value Proposition */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Value Proposition Header</h2>
        <p className={styles.sectionDescription}>
          Displayed before the first question to set expectations using exploratory, non-clinical
          language.
        </p>
        <div className={styles.demo}>
          <div className={intakeStyles.valueProposition}>
            <p className={intakeStyles.valuePropositionText}>
              These questions help you explore whether therapy might be worth trying right now.
            </p>
            <ul className={intakeStyles.valuePropositionList}>
              <li>Get clearer on what&apos;s happening and why it matters</li>
              <li>Understand how therapy might help your specific situation</li>
              <li>Learn what to talk about and look for in a first session</li>
              <li>Try a few optional practices you can bring to therapy</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Confetti Animation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Confetti Celebration</h2>
        <p className={styles.sectionDescription}>
          Celebratory animation triggers when completion results are displayed. Respects
          prefers-reduced-motion preference.
        </p>
        <div className={styles.demo}>
          <button
            type="button"
            onClick={() => triggerConfetti()}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              color: "white",
              background: "linear-gradient(135deg, #4a90d9 0%, #357abd 100%)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Trigger Confetti 🎉
          </button>
        </div>
      </section>

      {/* Section: ChatGPT Button */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>&quot;Open in ChatGPT&quot; Button</h2>
        <p className={styles.sectionDescription}>
          First experiment includes a button to continue exploration in ChatGPT with a contextual
          prompt.
        </p>
        <div className={styles.demo}>
          <div className={intakeStyles.experiment}>
            <span className={intakeStyles.experimentNumber}>1</span>
            <div className={intakeStyles.experimentContent}>
              <p>
                You might try noticing when you feel stuck and asking yourself: &quot;What would I
                try if I knew I couldn&apos;t fail?&quot; This isn&apos;t about taking action yet,
                just gathering data about what feels possible when pressure is removed.
              </p>
              <a
                href="https://chatgpt.com/?q=I%27m%20exploring%20therapy..."
                target="_blank"
                rel="noopener noreferrer"
                className={intakeStyles.chatGptButton}
                onClick={(e) => e.preventDefault()}
              >
                Explore this with ChatGPT →
              </a>
            </div>
          </div>
        </div>
        <p className={styles.sectionNote}>
          (Button disabled in demo - in production it opens ChatGPT with a contextual prompt)
        </p>
      </section>

      {/* Section: Markdown Rendering */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Markdown Rendering</h2>
        <p className={styles.sectionDescription}>
          Completion outputs support markdown formatting for better readability.
        </p>
        <div className={styles.demo}>
          <div style={{ padding: "1rem", background: "#f9f9f9", borderRadius: "8px" }}>
            <Markdown>
              {`Therapy might help by creating a **structured space** to explore these patterns:

- **Pattern recognition**: Notice when overthinking shows up and what triggers it
- **Alternative responses**: Practice responding to uncertainty without needing to control it
- **Self-compassion**: Build capacity to sit with discomfort instead of pushing through

This isn't about eliminating overthinking entirely—it's about building flexibility in how you relate to it.`}
            </Markdown>
          </div>
        </div>
        <p className={styles.sectionNote}>
          Supports bold, italics, lists, links, and other GitHub Flavored Markdown syntax.
        </p>
      </section>

      {/* Section: "Other" Option Support */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>&quot;Other&quot; Option for Multiple Choice</h2>
        <p className={styles.sectionDescription}>
          When users select &quot;Other&quot; in multiselect or singleselect questions, a text input
          appears for custom responses.
        </p>
        <div className={styles.demo}>
          <div className={intakeStyles.currentQuestion}>
            <div className={intakeStyles.questionLabel}>
              <span className={intakeStyles.questionNumber}>4.</span>
              What kind of therapy approach sounds most appealing to you?
            </div>
            <div className={intakeStyles.optionsWrapper}>
              <div className={intakeStyles.options}>
                <label className={intakeStyles.optionLabel}>
                  <input type="radio" name="demo-approach" className={intakeStyles.radio} />
                  <span className={intakeStyles.optionText}>
                    Structured and practical - clear strategies and homework
                  </span>
                </label>
                <label className={intakeStyles.optionLabel}>
                  <input type="radio" name="demo-approach" className={intakeStyles.radio} />
                  <span className={intakeStyles.optionText}>
                    Exploratory and reflective - understanding patterns and meanings
                  </span>
                </label>
                <label className={intakeStyles.optionLabel}>
                  <input
                    type="radio"
                    name="demo-approach"
                    defaultChecked
                    className={intakeStyles.radio}
                  />
                  <span className={intakeStyles.optionText}>Other</span>
                </label>
              </div>
              <div className={intakeStyles.otherInputWrapper}>
                <input
                  type="text"
                  className={intakeStyles.otherInput}
                  defaultValue="Something that combines both structure and exploration"
                  placeholder="Please specify..."
                />
              </div>
            </div>
          </div>
        </div>
        <p className={styles.sectionNote}>
          Submit button is disabled until the &quot;Other&quot; text field is filled when &quot;Other&quot;
          is selected. Answer submitted as &quot;Other: [custom text]&quot;.
        </p>
      </section>
    </div>
  );
}
