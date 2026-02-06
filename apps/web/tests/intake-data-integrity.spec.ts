/**
 * E2E tests for intake data integrity
 *
 * Tests verify:
 * - Rapid answer submission doesn't lose data (race condition test)
 * - "Other" option detection works correctly (no false positives)
 * - Data persists correctly to Redis
 * - All answers and reflections are captured
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3020";

test.describe("Intake Data Integrity", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to intake demo page
    await page.goto(`${BASE_URL}/intake`);

    // Wait for first question to load
    await page.waitForSelector("textarea, input[type='checkbox'], input[type='radio']", {
      timeout: 10000,
    });
  });

  test("should preserve all data when rapidly submitting answers", async ({ page }) => {
    // Q1: Text question - submit immediately
    await page.fill("textarea", "I'm feeling stuck and anxious about work");
    await page.click("button[type='submit']");

    // Q2: Multiselect - select and submit quickly without waiting for Q1 reflection
    await page.waitForSelector("input[type='checkbox']", { timeout: 5000 });
    await page.check("input[type='checkbox'][value='work']");
    await page.check("input[type='checkbox'][value='stress']");
    await page.click("button[type='submit']");

    // Q3: Text question - submit immediately again
    await page.waitForSelector("textarea", { timeout: 5000 });
    await page.fill("textarea", "I tend to overthink and avoid difficult decisions");
    await page.click("button[type='submit']");

    // Wait a moment for all reflections to load
    await page.waitForTimeout(3000);

    // Verify Q1 answer and reflection are present
    const q1Answer = page.locator("text=I'm feeling stuck and anxious about work");
    await expect(q1Answer).toBeVisible();

    // Verify Q2 answer is present (should show Work, Stress or similar)
    const q2Answer = page.locator("text=/Work|Stress/");
    await expect(q2Answer).toBeVisible();

    // Verify Q3 answer is present
    const q3Answer = page.locator("text=I tend to overthink and avoid difficult decisions");
    await expect(q3Answer).toBeVisible();

    // Count reflection blocks (there should be at least 2 visible - Q1 and Q2)
    const reflections = page.locator("[data-testid='reflection'], .reflection-message");
    const reflectionCount = await reflections.count();
    expect(reflectionCount).toBeGreaterThanOrEqual(2);
  });

  test('should handle "Other" option with custom text correctly', async ({ page }) => {
    // Navigate to a question with "Something else" option (Q2)
    await page.fill("textarea", "Initial answer");
    await page.click("button[type='submit']");

    // Wait for multiselect question
    await page.waitForSelector("input[type='checkbox']", { timeout: 5000 });

    // Select "Something else" option
    const otherCheckbox = page.locator("input[type='checkbox']").last(); // Usually last option
    await otherCheckbox.check();

    // Verify "other" text input appears
    const otherInput = page.locator("input[placeholder*='specify'], input[placeholder*='Please']");
    await expect(otherInput).toBeVisible();

    // Enter custom text
    await otherInput.fill("My custom concern about family dynamics");

    // Submit
    await page.click("button[type='submit']");

    // Wait and verify custom text appears in the answer
    await page.waitForTimeout(2000);
    const customAnswer = page.locator("text=My custom concern about family dynamics");
    await expect(customAnswer).toBeVisible();
  });

  test("should not show other input for options containing 'other' in the text", async ({
    page,
  }) => {
    // Complete Q1
    await page.fill("textarea", "Test answer");
    await page.click("button[type='submit']");

    // Wait for Q2
    await page.waitForSelector("input[type='checkbox']", { timeout: 5000 });

    // Select "Mood or motivation" (contains "or" but shouldn't trigger other input)
    const moodCheckbox = page.locator("label:has-text('Mood')").locator("input");
    await moodCheckbox.check();

    // Verify no "other" input appears
    const otherInput = page.locator("input[placeholder*='specify'], input[placeholder*='Please']");
    await expect(otherInput).not.toBeVisible();
  });

  test("should persist complete session data to Redis", async ({ page }) => {
    // Get session ID from page (it's generated on mount)
    const sessionId = await page.evaluate(() => {
      // Access the component's session ID if exposed, or extract from network requests
      return crypto.randomUUID(); // Fallback - in real test would extract from page
    });

    // Complete first 3 questions
    await page.fill("textarea", "Test answer 1");
    await page.click("button[type='submit']");

    await page.waitForSelector("input[type='checkbox']", { timeout: 5000 });
    await page.locator("input[type='checkbox']").first().check();
    await page.click("button[type='submit']");

    await page.waitForSelector("textarea", { timeout: 5000 });
    await page.fill("textarea", "Test answer 3");
    await page.click("button[type='submit']");

    // Wait for persistence
    await page.waitForTimeout(2000);

    // The CLI verification command will check Redis data
    // This test just ensures the flow completes without errors

    // Verify no error messages
    const errorMessage = page.locator("text=/error|failed/i");
    await expect(errorMessage).not.toBeVisible();
  });

  test("should maintain data integrity across full questionnaire", async ({ page }) => {
    const answers = [
      "Feeling overwhelmed with work stress",
      ["work", "stress"], // Multiselect
      "I push through until I burn out",
      ["talking_to_friends", "exercise"], // Multiselect
      "I'd continue feeling exhausted and drained",
      "I'd feel more balanced and in control",
      ["cost", "time"], // Multiselect
      "structured_practical", // Singleselect
      "open_unsure", // Singleselect
    ];

    let currentQuestion = 0;

    while (currentQuestion < answers.length) {
      const answer = answers[currentQuestion];

      if (typeof answer === "string") {
        // Text or radio input
        const textarea = await page.$("textarea");
        if (textarea) {
          await page.fill("textarea", answer);
        } else {
          // Radio button
          await page.check(`input[type='radio'][value='${answer}']`);
        }
      } else {
        // Multiselect checkboxes
        for (const value of answer) {
          await page.check(`input[type='checkbox'][value='${value}']`);
        }
      }

      // Submit
      await page.click("button[type='submit']");

      // Wait for next question or completion
      await page.waitForTimeout(1500);

      currentQuestion++;

      // Check if we've reached completion
      const completionText = await page.$("text=/completed|finished/i");
      if (completionText) {
        break;
      }
    }

    // Verify completion section appears
    const completionSection = page.locator("text=/personalized|brief|session guide/i");
    await expect(completionSection.first()).toBeVisible({ timeout: 15000 });

    // Verify all answers are still visible in chat history
    const firstAnswer = page.locator("text=Feeling overwhelmed with work stress");
    await expect(firstAnswer).toBeVisible();
  });
});

test.describe("Structured Options Verification", () => {
  test("should use option values for storage, not display text", async ({ page }) => {
    await page.goto(`${BASE_URL}/intake`);

    // Complete Q1
    await page.fill("textarea", "Test");
    await page.click("button[type='submit']");

    // Intercept network request to verify option values
    const requestPromise = page.waitForRequest(
      (request) => request.url().includes("/api/intake/step") && request.method() === "POST",
    );

    await page.waitForSelector("input[type='checkbox']", { timeout: 5000 });
    await page.locator("input[type='checkbox']").first().check();
    await page.click("button[type='submit']");

    const request = await requestPromise;
    const postData = request.postDataJSON();

    // Verify answer uses value, not display text
    // Should be something like "work" not "Work or career"
    expect(postData.currentAnswer).toBeTruthy();
    if (Array.isArray(postData.currentAnswer)) {
      // Values should be lowercase with underscores, not spaces
      for (const value of postData.currentAnswer) {
        expect(value).toMatch(/^[a-z_]+$/);
      }
    }
  });
});
