#!/usr/bin/env bun

/**
 * Test script for web Redis client
 */

import { closeRedisClient, getRedisClient } from "./lib/redis/client";

async function testWebClient() {
  console.log("🧪 Testing Web Redis Client...");

  try {
    // Test connection
    console.log("\n1. Testing connection...");
    const client = await getRedisClient();
    console.log("   ✅ Connected to Redis Cloud");

    // Test write
    console.log("\n2. Testing write...");
    await client.set("test:web:hello", "world");
    console.log("   ✅ Write successful");

    // Test read
    console.log("\n3. Testing read...");
    const value = await client.get("test:web:hello");
    if (value === "world") {
      console.log("   ✅ Read successful:", value);
    } else {
      throw new Error(`Expected 'world', got '${value}'`);
    }

    // Test delete
    console.log("\n4. Testing delete...");
    await client.del("test:web:hello");
    console.log("   ✅ Delete successful");

    // Test singleton behavior
    console.log("\n5. Testing singleton behavior...");
    const client2 = await getRedisClient();
    if (client === client2) {
      console.log("   ✅ Singleton pattern working");
    } else {
      throw new Error("Singleton pattern failed - different instances returned");
    }

    console.log("\n✨ All web client tests passed!");

    // Cleanup
    await closeRedisClient();
    console.log("👋 Disconnected from Redis");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testWebClient();
