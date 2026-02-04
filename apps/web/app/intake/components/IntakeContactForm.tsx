/**
 * Contact form component for collecting user contact info
 * Can be used during waiting state or after results
 */

import { useState } from "react";
import { saveContactInfo } from "@/actions/intake";
import styles from "../intake.module.css";

interface IntakeContactFormProps {
  variant?: "waiting" | "afterResults";
  sessionId: string | null;
  onSubmit?: (email: string, phone: string) => void;
}

export function IntakeContactForm({ variant = "afterResults", sessionId, onSubmit }: IntakeContactFormProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit(contactEmail, contactPhone);
      return;
    }

    // Save to Redis
    if (sessionId && (contactEmail || contactPhone)) {
      setIsSubmitting(true);
      try {
        const result = await saveContactInfo(sessionId, contactEmail || undefined, contactPhone || undefined);
        if (result.success) {
          setSubmitSuccess(true);
          console.log("Contact info saved successfully");
        } else {
          console.error("Failed to save contact info:", result.error);
        }
      } catch (error) {
        console.error("Error saving contact info:", error);
      } finally {
        setIsSubmitting(false);
      }
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

  // Show success message after submit
  if (submitSuccess) {
    return (
      <div className={formClass}>
        <p className={formTextClass} style={{ color: "var(--color-success, #22c55e)" }}>
          ✓ Thank you! We&apos;ll be in touch soon.
        </p>
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
          disabled={isSubmitting}
        />
        <input
          type="tel"
          placeholder={variant === "waiting" ? "Phone number (optional)" : "Phone number"}
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className={inputClass}
          disabled={isSubmitting}
        />
        {variant === "afterResults" && (
          <button
            type="button"
            className={submitButtonClass}
            disabled={(!contactEmail && !contactPhone) || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
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
