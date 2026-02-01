import type { Metadata } from "next";
import { DAPForm } from "./dap-form";
import styles from "./dap.module.css";

export const metadata: Metadata = {
  title: "DAP Notes",
  description: "Generate DAP notes from therapy session descriptions",
};

export default function DAPPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>DAP Notes</h1>
      <DAPForm />
    </main>
  );
}
