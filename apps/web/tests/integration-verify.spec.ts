/**
 * Integration test for E2E data verification
 *
 * This test:
 * 1. Completes a full intake questionnaire
 * 2. Gets the most recent session ID from Redis
 * 3. Outputs the session ID for CLI verification
 *
 * After running this test, verify with:
 * cd packages/data && bun run src/bin/cli.ts intake verify <sessionId> --verbose
 */

import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3020";

test.describe("Integration: Form Submission → CLI Verification", () => {
  test("should complete intake and save session ID for CLI verification", async ({ page }) => {
    // Increase timeout for this test due to LLM generation time
    test.setTimeout(180000); // 3 minutes

    // Navigate to intake page
    await page.goto(`${BASE_URL}/intake`);

    // Wait for first question to load
    await page.waitForSelector("textarea, input[type='checkbox'], input[type='radio']", {
      timeout: 10000,
    });

    console.log("\n🧪 Starting intake questionnaire...\n");

    // Define answers for all questions
    const answers = [
      "I'm feeling stuck and anxious about work", // Q1: text
      ["work", "stress"], // Q2: multiselect
      "I tend to overthink and avoid difficult decisions", // Q3: text
      ["talking_to_friends", "exercise"], // Q4: multiselect
      "I'd continue feeling exhausted and drained", // Q5: text
      "I'd feel more balanced and in control", // Q6: text
      ["cost", "time"], // Q7: multiselect
      "structured_practical", // Q8: singleselect
      "just_exploring", // Q9: singleselect
    ];

    let questionNumber = 1;

    for (const answer of answers) {
      console.log(`Question ${questionNumber}/${answers.length}...`);

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

      // Wait for submission to process
      await page.waitForTimeout(1500);

      questionNumber++;

      // Check if we've reached completion
      const completionText = await page.$("text=/completed|finished|personalized/i");
      if (completionText) {
        console.log("\n✅ Questionnaire completed!\n");
        break;
      }
    }

    // Wait for completion section to be visible (polls automatically)
    console.log("\n⏳ Waiting for completion outputs to generate (this may take 2+ minutes)...\n");
    const completionSection = page.locator("text=/personalized|brief|session guide/i");
    await expect(completionSection.first()).toBeVisible({ timeout: 120000 }); // 2 minutes

    console.log("\n✅ Completion section visible!\n");

    // Wait for final persistence
    await page.waitForTimeout(3000);

    // Get session ID from DOM data attribute
    console.log("\n🔍 Getting session ID from page...\n");

    const sessionId = await page.getAttribute("[data-intake-session-id]", "data-intake-session-id");

    if (!sessionId || sessionId.length < 10) {
      throw new Error(`Invalid or missing session ID from DOM: ${sessionId}`);
    }

    console.log(`📋 Session ID: ${sessionId}\n`);

    // Save session ID to file for easy CLI verification
    const outputDir = path.join(process.cwd(), "test-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const sessionIdFile = path.join(outputDir, "last-session-id.txt");
    fs.writeFileSync(sessionIdFile, sessionId, "utf-8");

    console.log(`📝 Session ID saved to: ${sessionIdFile}\n`);
    console.log("\n🔍 To verify this session, run:\n");
    console.log("   cd packages/data");
    console.log(`   bun run src/bin/cli.ts intake verify ${sessionId} --verbose\n`);

    // Verify we got a session ID
    expect(sessionId).toBeTruthy();
    expect(sessionId.length).toBeGreaterThan(10);
  });
});
