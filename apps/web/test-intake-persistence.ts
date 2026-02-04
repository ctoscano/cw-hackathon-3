#!/usr/bin/env bun

/**
 * Comprehensive test script for intake persistence functions
 */

import {
  saveIntakeProgress,
  getIntakeProgress,
  saveIntakeCompletion,
  saveContactInfo,
  trackChatGPTClick,
  getSessionData,
} from "./lib/redis/intake";
import { closeRedisClient } from "./lib/redis/client";

async function testIntakePersistence() {
  console.log("🧪 Testing Intake Persistence Functions...");

  const sessionId = `test-intake-${Date.now()}`;

  try {
    // Test 1: Save progress for multiple questions
    console.log("\n1. Testing saveIntakeProgress...");
    await saveIntakeProgress(sessionId, "q1", "answer to question 1", "reflection on q1");
    console.log("   ✅ Saved progress for question 1");

    await saveIntakeProgress(
      sessionId,
      "q2",
      ["option1", "option2"],
      "reflection on q2",
    );
    console.log("   ✅ Saved progress for question 2 (multi-select)");

    // Test 2: Retrieve progress
    console.log("\n2. Testing getIntakeProgress...");
    const progress = await getIntakeProgress(sessionId);
    if (progress.length === 2) {
      console.log("   ✅ Retrieved progress:", progress.length, "entries");
      console.log("      Q1 answer:", progress[0].answer);
      console.log("      Q2 answer:", progress[1].answer);
    } else {
      throw new Error(`Expected 2 progress entries, got ${progress.length}`);
    }

    // Test 3: Save completion outputs
    console.log("\n3. Testing saveIntakeCompletion...");
    await saveIntakeCompletion(sessionId, {
      personalizedBrief: "Test personalized brief for the client",
      firstSessionGuide: "Test first session guide with goals",
      experiments: ["Experiment 1", "Experiment 2", "Experiment 3"],
    });
    console.log("   ✅ Saved completion outputs");

    // Test 4: Save contact info
    console.log("\n4. Testing saveContactInfo...");
    await saveContactInfo(sessionId, "test@example.com", "555-1234");
    console.log("   ✅ Saved contact information");

    // Test 5: Track ChatGPT button clicks
    console.log("\n5. Testing trackChatGPTClick...");
    await trackChatGPTClick(sessionId, new Date().toISOString());
    await trackChatGPTClick(sessionId, new Date().toISOString());
    console.log("   ✅ Tracked 2 ChatGPT button clicks");

    // Test 6: Get complete session data
    console.log("\n6. Testing getSessionData...");
    const fullData = await getSessionData(sessionId);

    if (!fullData) {
      throw new Error("Failed to retrieve session data");
    }

    console.log("   ✅ Retrieved complete session data:");
    console.log("      Session ID:", fullData.sessionId);
    console.log("      Progress entries:", fullData.progress.length);
    console.log("      Has completion:", !!fullData.completion);
    console.log("      Has contact:", !!fullData.contact);
    console.log("      Interactions:", fullData.interactions.length);
    console.log("      Created at:", fullData.metadata.createdAt);
    console.log("      Completed at:", fullData.metadata.completedAt);

    // Verify data integrity
    if (fullData.progress.length !== 2) {
      throw new Error("Progress count mismatch");
    }
    if (!fullData.completion) {
      throw new Error("Completion data missing");
    }
    if (fullData.completion.outputs.experiments.length !== 3) {
      throw new Error("Experiments count mismatch");
    }
    if (!fullData.contact || fullData.contact.email !== "test@example.com") {
      throw new Error("Contact info mismatch");
    }
    if (fullData.interactions.length !== 2) {
      throw new Error("Interactions count mismatch");
    }

    console.log("\n   ✅ All data integrity checks passed");

    // Test 7: Get non-existent session
    console.log("\n7. Testing non-existent session...");
    const nonExistent = await getSessionData("non-existent-session");
    if (nonExistent === null) {
      console.log("   ✅ Correctly returned null for non-existent session");
    } else {
      throw new Error("Should have returned null");
    }

    // Test 8: Partial contact info (email only)
    console.log("\n8. Testing partial contact info...");
    const sessionId2 = `test-intake-${Date.now() + 1}`;
    await saveIntakeProgress(sessionId2, "q1", "test answer", "test reflection");
    await saveContactInfo(sessionId2, "email-only@example.com");
    const session2Data = await getSessionData(sessionId2);
    if (session2Data?.contact?.email && !session2Data.contact.phone) {
      console.log("   ✅ Partial contact info works (email only)");
    } else {
      throw new Error("Partial contact info failed");
    }

    console.log("\n✨ All intake persistence tests passed!");

    console.log("\n🧹 Test data remains in Redis for verification");
    console.log("   Test session IDs:", sessionId, sessionId2);

    await closeRedisClient();
    console.log("👋 Disconnected from Redis");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    await closeRedisClient();
    process.exit(1);
  }
}

testIntakePersistence();
