#!/bin/bash

# Integration Test & CLI Verification Script
# This script runs the E2E test and then verifies the session with the CLI

set -e

echo "🧪 Integration Test & CLI Verification"
echo "======================================"
echo ""

# Check if dev server is running
echo "📡 Checking if dev server is running on port 3020..."
if ! curl -s http://localhost:3020 > /dev/null; then
  echo ""
  echo "❌ Dev server is not running!"
  echo ""
  echo "Please start the dev server in another terminal:"
  echo "  pnpm dev"
  echo ""
  exit 1
fi

echo "✅ Dev server is running"
echo ""

# Run the integration test
echo "🧪 Running integration test..."
echo ""
pnpm test:verify

echo ""
echo "======================================"
echo ""

# Check if session ID file exists
SESSION_ID_FILE="test-output/last-session-id.txt"
if [ ! -f "$SESSION_ID_FILE" ]; then
  echo "❌ Session ID file not found: $SESSION_ID_FILE"
  echo "The test may have failed to capture the session ID."
  exit 1
fi

# Read session ID
SESSION_ID=$(cat "$SESSION_ID_FILE")
echo "📋 Session ID: $SESSION_ID"
echo ""

# Verify with CLI
echo "🔍 Verifying session with CLI..."
echo ""
cd ../../packages/data
bun --env-file=../../apps/web/.env.local run src/bin/cli.ts intake verify "$SESSION_ID" --verbose

echo ""
echo "======================================"
echo "✅ Integration test complete!"
echo ""
