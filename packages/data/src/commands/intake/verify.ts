/**
 * CLI command to verify intake session data in Redis
 *
 * Usage:
 *   bun run src/bin/cli.ts intake verify <sessionId>
 *
 * Verifies:
 * - Session exists in Redis
 * - All answers are present
 * - Reflections are captured
 * - Data structure is intact
 */

import { defineCommand } from "citty";
import { consola } from "consola";
import { createRedisClient } from "../../lib/redis/client.js";

// Answer type from Redis progress entries
interface ProgressAnswer {
  questionId?: string;
  questionPrompt?: string;
  answer?: string | string[];
  reflection?: string;
}

export const verifyCommand = defineCommand({
  meta: {
    name: "verify",
    description: "Verify intake session data in Redis",
  },
  args: {
    sessionId: {
      type: "positional",
      description: "Session ID to verify",
      required: true,
    },
    verbose: {
      type: "boolean",
      description: "Show detailed output",
      alias: "v",
      default: false,
    },
  },
  async run({ args }) {
    const { sessionId, verbose } = args;

    consola.start(`Verifying intake session: ${sessionId}`);

    try {
      const redis = await createRedisClient();

      // Check if session exists (using :meta key)
      const metaKey = `intake:${sessionId}:meta`;
      const metaData = await redis.hGetAll(metaKey);

      if (!metaData || Object.keys(metaData).length === 0) {
        consola.error(`Session not found in Redis: ${sessionId}`);
        consola.info("Available sessions:");

        // List available sessions
        const keys = await redis.keys("intake:*:meta");
        for (const key of keys.slice(0, 10)) {
          const id = key.replace("intake:", "").replace(":meta", "");
          consola.info(`  - ${id}`);
        }
        if (keys.length > 10) {
          consola.info(`  ... and ${keys.length - 10} more`);
        }

        process.exit(1);
      }

      // Get all session data
      const progressKey = `intake:${sessionId}:progress`;
      const progressEntries = await redis.lRange(progressKey, 0, -1);
      const progress = progressEntries.map((entry) => JSON.parse(entry));

      // Get completion data (if exists)
      const completionKey = `intake:${sessionId}:completion`;
      const completionData = await redis.hGetAll(completionKey);
      let completionOutputs: {
        personalizedBrief: string;
        firstSessionGuide: string;
        experiments: string[];
      } | null = null;

      if (completionData && Object.keys(completionData).length > 0) {
        completionOutputs = {
          personalizedBrief: completionData.personalizedBrief || "",
          firstSessionGuide: completionData.firstSessionGuide || "",
          experiments: completionData.experiments ? JSON.parse(completionData.experiments) : [],
        };
      }

      const session = {
        sessionId,
        intakeType: metaData.intakeType,
        createdAt: metaData.createdAt,
        updatedAt: metaData.lastUpdated,
        answers: progress,
        completionOutputs,
      };

      // Verify data structure
      consola.success("Session found in Redis");
      consola.info(`Intake Type: ${session.intakeType}`);
      consola.info(`Created: ${session.createdAt}`);
      consola.info(`Last Updated: ${session.updatedAt}`);

      // Verify answers
      const answers = session.answers || [];
      consola.info(`Total Answers: ${answers.length}`);

      if (answers.length === 0) {
        consola.warn("No answers found in session");
      } else {
        consola.success(`Found ${answers.length} answers`);

        if (verbose) {
          consola.box("Detailed Answer Verification");

          for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            consola.info(`\nAnswer ${i + 1}:`);
            consola.info(`  Question ID: ${answer.questionId || "N/A"}`);
            consola.info(`  Question: ${answer.questionPrompt?.substring(0, 60) || "N/A"}...`);

            if (Array.isArray(answer.answer)) {
              consola.info(`  Answer (multiselect): ${answer.answer.join(", ")}`);
            } else {
              consola.info(`  Answer: ${answer.answer?.substring(0, 60) || "N/A"}...`);
            }

            if (answer.reflection) {
              consola.success(`  ✓ Reflection present (${answer.reflection.length} chars)`);
            } else {
              consola.warn("  ✗ Reflection missing");
            }
          }
        }
      }

      // Check for completion data
      if (session.completionOutputs) {
        consola.success("Completion outputs found");
        if (verbose) {
          consola.info(
            `  - Personalized Brief: ${session.completionOutputs.personalizedBrief ? "✓" : "✗"}`,
          );
          consola.info(
            `  - First Session Guide: ${session.completionOutputs.firstSessionGuide ? "✓" : "✗"}`,
          );
          consola.info(`  - Experiments: ${session.completionOutputs.experiments?.length || 0}`);
        }
      } else {
        consola.info("Completion outputs: Not yet generated (session in progress)");
      }

      // Data integrity checks
      consola.box("Data Integrity Checks");

      let issuesFound = 0;

      // Check 1: All answers have reflections (except possibly the last one)
      const answersWithoutReflection = answers.filter(
        (a: ProgressAnswer, i: number) => !a.reflection && i < answers.length - 1,
      );
      if (answersWithoutReflection.length > 0) {
        consola.warn(
          `Found ${answersWithoutReflection.length} answers without reflections (excluding last)`,
        );
        issuesFound++;
      } else {
        consola.success("✓ All answers have reflections (or are in progress)");
      }

      // Check 2: All answers have question IDs
      const answersWithoutQuestionId = answers.filter((a: ProgressAnswer) => !a.questionId);
      if (answersWithoutQuestionId.length > 0) {
        consola.error(`Found ${answersWithoutQuestionId.length} answers without question IDs`);
        issuesFound++;
      } else {
        consola.success("✓ All answers have question IDs");
      }

      // Check 3: Verify answer values are using option values (not display text)
      const multiselectAnswers = answers.filter((a: ProgressAnswer) => Array.isArray(a.answer));
      if (multiselectAnswers.length > 0) {
        consola.info(`Checking ${multiselectAnswers.length} multiselect answers...`);

        for (const answer of multiselectAnswers) {
          for (const value of answer.answer) {
            // Check if value is lowercase with underscores (correct) vs display text (wrong)
            if (/^[a-z_]+$/.test(value)) {
              // Good - using option value
            } else if (/\s|[A-Z]/.test(value)) {
              consola.warn(`  ⚠ Answer may be using display text instead of value: "${value}"`);
              issuesFound++;
            }
          }
        }
        if (issuesFound === 0) {
          consola.success("✓ Multiselect answers use option values (not display text)");
        }
      }

      // Final summary
      consola.box("Verification Summary");
      if (issuesFound === 0) {
        consola.success("✓ Session data is intact and valid");
        consola.success(`✓ ${answers.length} answers verified`);
        consola.success("✓ No data integrity issues found");
      } else {
        consola.warn(`Found ${issuesFound} potential issues`);
        consola.info("Review the warnings above for details");
      }

      await redis.quit();
    } catch (error) {
      consola.error("Failed to verify session:", error);
      process.exit(1);
    }
  },
});
