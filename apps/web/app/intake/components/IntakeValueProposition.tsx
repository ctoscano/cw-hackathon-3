/**
 * Value proposition component shown before the first question
 */

import styles from "../intake.module.css";

export function IntakeValueProposition() {
  return (
    <div className={styles.valueProposition}>
      <p className={styles.valuePropositionText}>
        These questions help you explore whether therapy might be worth trying right now.
      </p>
      <ul className={styles.valuePropositionList}>
        <li>Get clearer on what's happening and why it matters</li>
        <li>Understand how therapy might help your specific situation</li>
        <li>Learn what to talk about and look for in a first session</li>
        <li>Try a few optional practices you can bring to therapy</li>
      </ul>
    </div>
  );
}
