#!/usr/bin/env bun

/**
 * Test script for CLI Redis client
 */

import { createRedisClient, withRedisClient } from "./src/lib/redis/client.ts";

async function testCLIClient() {
  console.log("🧪 Testing CLI Redis Client...");

  try {
    // Test direct connection
    console.log("\n1. Testing direct connection...");
    const client = await createRedisClient();
    console.log("   ✅ Connected to Redis Cloud");

    // Test write
    console.log("\n2. Testing write...");
    await client.set("test:cli:hello", "world");
    console.log("   ✅ Write successful");

    // Test read
    console.log("\n3. Testing read...");
    const value = await client.get("test:cli:hello");
    if (value === "world") {
      console.log("   ✅ Read successful:", value);
    } else {
      throw new Error(`Expected 'world', got '${value}'`);
    }

    // Test delete
    console.log("\n4. Testing delete...");
    await client.del("test:cli:hello");
    console.log("   ✅ Delete successful");

    await client.quit();

    // Test withRedisClient helper
    console.log("\n5. Testing withRedisClient helper...");
    const result = await withRedisClient(async (c) => {
      await c.set("test:cli:helper", "works");
      return await c.get("test:cli:helper");
    });
    if (result === "works") {
      console.log("   ✅ Helper function working:", result);
    } else {
      throw new Error(`Expected 'works', got '${result}'`);
    }

    // Cleanup
    const cleanupClient = await createRedisClient();
    await cleanupClient.del("test:cli:helper");
    await cleanupClient.quit();

    console.log("\n✨ All CLI client tests passed!");
    console.log("👋 Disconnected from Redis");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testCLIClient();
