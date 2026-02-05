#!/usr/bin/env bun

/**
 * Test script for DAP archival functions
 */

import { archiveDAPOutput, getDAPCount, getDAPOutput, listDAPOutputs } from "./lib/redis/archive";
import { closeRedisClient } from "./lib/redis/client";

async function testDAPArchival() {
  console.log("🧪 Testing DAP Archival Functions...");

  try {
    // Test 1: Archive a DAP output
    console.log("\n1. Testing archiveDAPOutput...");
    const sessionId1 = `test-session-${Date.now()}`;
    await archiveDAPOutput(
      sessionId1,
      {
        disclosure: "Test disclosure content",
        assessment: "Test assessment content",
        plan: "Test plan content",
      },
      {
        model: "gpt-4",
        tokensUsed: 1000,
        generationTimeMs: 2500,
      },
    );
    console.log("   ✅ DAP archived successfully:", sessionId1);

    // Test 2: Retrieve the archived DAP
    console.log("\n2. Testing getDAPOutput...");
    const retrieved = await getDAPOutput(sessionId1);
    if (!retrieved) {
      throw new Error("Failed to retrieve DAP output");
    }
    if (retrieved.dap.disclosure === "Test disclosure content") {
      console.log("   ✅ DAP retrieved successfully");
      console.log("      Session ID:", retrieved.sessionId);
      console.log("      Timestamp:", retrieved.timestamp);
      console.log("      Tokens:", retrieved.metadata.tokensUsed);
    } else {
      throw new Error("Retrieved DAP content mismatch");
    }

    // Test 3: Archive another DAP
    console.log("\n3. Testing multiple archives...");
    const sessionId2 = `test-session-${Date.now() + 1}`;
    await archiveDAPOutput(
      sessionId2,
      {
        disclosure: "Second test disclosure",
        assessment: "Second test assessment",
        plan: "Second test plan",
      },
      { model: "sonnet", tokensUsed: 1500 },
    );
    console.log("   ✅ Second DAP archived:", sessionId2);

    // Test 4: List archived DAPs
    console.log("\n4. Testing listDAPOutputs...");
    const outputs = await listDAPOutputs({ limit: 10, offset: 0 });
    if (outputs.length >= 2) {
      console.log("   ✅ Listed DAP outputs:", outputs.length);
      console.log("      Most recent:", outputs[0].sessionId);
    } else {
      console.log("   ⚠️  Found", outputs.length, "outputs (expected at least 2)");
    }

    // Test 5: Get count
    console.log("\n5. Testing getDAPCount...");
    const count = await getDAPCount();
    console.log("   ✅ Total archived DAPs:", count);

    // Test 6: Retrieve non-existent DAP
    console.log("\n6. Testing non-existent DAP...");
    const nonExistent = await getDAPOutput("non-existent-id");
    if (nonExistent === null) {
      console.log("   ✅ Correctly returned null for non-existent DAP");
    } else {
      throw new Error("Should have returned null for non-existent DAP");
    }

    console.log("\n✨ All DAP archival tests passed!");

    // Cleanup - optionally remove test data
    console.log("\n🧹 Test data remains in Redis for verification");
    console.log("   Test session IDs:", sessionId1, sessionId2);

    await closeRedisClient();
    console.log("👋 Disconnected from Redis");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    await closeRedisClient();
    process.exit(1);
  }
}

testDAPArchival();
