/**
 * Contact form component for collecting user contact info
 * Can be used during waiting state or after results
 */

import { useState } from "react";
import styles from "../intake.module.css";

interface IntakeContactFormProps {
  variant?: "waiting" | "afterResults";
  onSubmit?: (email: string, phone: string) => void;
}

export function IntakeContactForm({ variant = "afterResults", onSubmit }: IntakeContactFormProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(contactEmail, contactPhone);
    } else {
      // TODO: Submit contact info to backend
      console.log("Contact info:", { contactEmail, contactPhone });
    }
  };

  // Choose styles based on variant
  const promptClass = variant === "waiting" ? styles.contactPrompt : styles.contactPromptAboveResults;
  const promptTextClass =
    variant === "waiting" ? styles.contactPromptText : styles.contactPromptTextAbove;
  const buttonsClass =
    variant === "waiting" ? styles.contactPromptButtons : styles.contactPromptButtonsAbove;
  const yesButtonClass = variant === "waiting" ? styles.contactYesButton : styles.contactYesButtonAbove;
  const noButtonClass = variant === "waiting" ? styles.contactNoButton : styles.contactNoButtonAbove;
  const formClass = variant === "waiting" ? styles.contactForm : styles.contactFormAboveResults;
  const formTextClass = variant === "waiting" ? styles.contactFormText : styles.contactFormTextAbove;
  const inputsClass = variant === "waiting" ? styles.contactInputs : styles.contactInputsAbove;
  const inputClass = variant === "waiting" ? styles.contactInput : styles.contactInputAbove;
  const submitButtonClass = variant === "waiting" ? undefined : styles.contactSubmitButtonAbove;

  if (!showContactForm) {
    return (
      <div className={promptClass}>
        <p className={promptTextClass}>
          {variant === "waiting"
            ? "While you wait, would you like us to help connect you with a therapist?"
            : "Would you like help connecting with a therapist?"}
        </p>
        <div className={buttonsClass}>
          <button type="button" onClick={() => setShowContactForm(true)} className={yesButtonClass}>
            Yes, I&apos;d like that
          </button>
          <button type="button" onClick={() => setShowContactForm(false)} className={noButtonClass}>
            No thanks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={formClass}>
      <p className={formTextClass}>
        Great! Share your email or phone number and we&apos;ll reach out to help you get started.
      </p>
      <div className={inputsClass}>
        <input
          type="email"
          placeholder={variant === "waiting" ? "Email address (optional)" : "Email address"}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="tel"
          placeholder={variant === "waiting" ? "Phone number (optional)" : "Phone number"}
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className={inputClass}
        />
        {variant === "afterResults" && (
          <button
            type="button"
            className={submitButtonClass}
            disabled={!contactEmail && !contactPhone}
            onClick={handleSubmit}
          >
            Submit
          </button>
        )}
      </div>
      {variant === "waiting" && (
        <p className={styles.contactFormNote}>
          You can skip this - your results will show below either way.
        </p>
      )}
    </div>
  );
}
