import type { Metadata } from "next";
import { IntakeForm } from "./intake-form";
import styles from "./intake.module.css";

export const metadata: Metadata = {
  title: "Is Therapy Right for Me?",
  description:
    "A guided exploration to help you understand if therapy might be helpful right now, and how to make the most of it if you decide to try.",
};

export default function IntakePage() {
  return (
    <main className={styles.main}>
      <IntakeForm />
    </main>
  );
}
