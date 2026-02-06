import { defineCommand } from "citty";
import { getDAPCount, getDAPOutput, isRedisEnabled, listDAPOutputs } from "../../lib/redis/archive";

const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List archived DAP sessions",
  },
  args: {
    limit: {
      type: "string",
      description: "Number of sessions to display (default: 20)",
      default: "20",
    },
    offset: {
      type: "string",
      description: "Number of sessions to skip (default: 0)",
      default: "0",
    },
  },
  async run({ args }) {
    if (!isRedisEnabled()) {
      console.error("❌ Redis is not enabled. Set REDIS_URL environment variable.");
      process.exit(1);
    }

    const limit = Number.parseInt(args.limit, 10);
    const offset = Number.parseInt(args.offset, 10);

    if (Number.isNaN(limit) || Number.isNaN(offset)) {
      console.error("❌ Invalid limit or offset - must be numbers");
      process.exit(1);
    }

    console.log("📋 Fetching archived DAP sessions...\n");

    const [outputs, totalCount] = await Promise.all([
      listDAPOutputs({ limit, offset }),
      getDAPCount(),
    ]);

    if (outputs.length === 0) {
      console.log("No archived DAP sessions found.");
      console.log(`Total archived: ${totalCount}`);
      return;
    }

    console.log(`Total archived: ${totalCount}`);
    console.log(`Showing ${outputs.length} sessions (offset: ${offset}):\n`);

    // Simple table display
    console.log("┌────────────────────┬─────────────────────┬────────────────────┬──────────┐");
    console.log("│ Session ID         │ Timestamp           │ Intake Type        │ Model    │");
    console.log("├────────────────────┼─────────────────────┼────────────────────┼──────────┤");

    for (const output of outputs) {
      const sessionId = output.sessionId.slice(0, 18).padEnd(18);
      const timestamp = new Date(output.timestamp)
        .toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        .padEnd(19);
      const intakeType = output.intakeType.slice(0, 18).padEnd(18);
      const model = (output.metadata.model || "N/A").padEnd(8);

      console.log(`│ ${sessionId} │ ${timestamp} │ ${intakeType} │ ${model} │`);
    }

    console.log("└────────────────────┴─────────────────────┴────────────────────┴──────────┘");

    console.log(`\n💡 Use 'dap archive view <session-id>' to view details`);
  },
});

const viewCommand = defineCommand({
  meta: {
    name: "view",
    description: "View a specific archived DAP session",
  },
  args: {
    sessionId: {
      type: "positional",
      description: "Session ID to view",
      required: true,
    },
    format: {
      type: "string",
      description: "Output format: json or text (default: text)",
      default: "text",
    },
  },
  async run({ args }) {
    if (!isRedisEnabled()) {
      console.error("❌ Redis is not enabled. Set REDIS_URL environment variable.");
      process.exit(1);
    }

    const sessionId = args.sessionId;
    const output = await getDAPOutput(sessionId);

    if (!output) {
      console.error(`❌ Session not found: ${sessionId}`);
      process.exit(1);
    }

    if (args.format === "json") {
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    // Text format
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📄 DAP Session: ${output.sessionId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`⏰ Timestamp: ${new Date(output.timestamp).toLocaleString()}`);
    console.log(`📋 Intake Type: ${output.intakeType}`);

    if (output.metadata.model) {
      console.log(`🤖 Model: ${output.metadata.model}`);
    }
    if (output.metadata.tokensUsed) {
      console.log(`🔢 Tokens Used: ${output.metadata.tokensUsed.toLocaleString()}`);
    }
    if (output.metadata.generationTimeMs) {
      console.log(`⏱️  Generation Time: ${output.metadata.generationTimeMs}ms`);
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log("📊 Data (Disclosure)");
    console.log("─".repeat(60));
    console.log(output.dap.disclosure);

    console.log(`\n${"─".repeat(60)}`);
    console.log("🔍 Assessment");
    console.log("─".repeat(60));
    console.log(output.dap.assessment);

    console.log(`\n${"─".repeat(60)}`);
    console.log("📋 Plan");
    console.log("─".repeat(60));
    console.log(output.dap.plan);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  },
});

export const archiveCommand = defineCommand({
  meta: {
    name: "archive",
    description: "View archived DAP sessions",
  },
  subCommands: {
    list: listCommand,
    view: viewCommand,
  },
});
