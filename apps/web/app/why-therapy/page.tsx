import type { Metadata } from "next";
import { VoiceIntakeClient } from "./voice-intake-client";
import styles from "./why-therapy.module.css";

export const metadata: Metadata = {
  title: "Why Therapy? - Voice Guided Exploration",
  description:
    "Have a voice conversation to explore whether therapy might be right for you. Speak naturally with our AI guide who will walk you through the process.",
};

export default function WhyTherapyPage() {
  return (
    <main className={styles.main}>
      <VoiceIntakeClient />
    </main>
  );
}
