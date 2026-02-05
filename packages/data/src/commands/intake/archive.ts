import { defineCommand } from "citty";
import {
  getIntakeSessionCount,
  getSessionData,
  isRedisEnabled,
  listIntakeSessions,
} from "../../lib/redis/intake-archive.js";

const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List archived intake sessions",
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
    search: {
      type: "string",
      description: "Search filter for session IDs",
      required: false,
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

    console.log("📋 Fetching archived intake sessions...\n");

    const [sessions, totalCount] = await Promise.all([
      listIntakeSessions({ limit, offset, search: args.search }),
      getIntakeSessionCount(),
    ]);

    if (sessions.length === 0) {
      console.log("No archived intake sessions found.");
      console.log(`Total archived: ${totalCount}`);
      return;
    }

    console.log(`Total archived: ${totalCount}`);
    console.log(`Showing ${sessions.length} sessions (offset: ${offset}):\n`);

    // Simple table display
    console.log(
      "┌────────────────────┬─────────────────────┬──────────────┬──────────┬─────────────────────────┐",
    );
    console.log(
      "│ Session ID         │ Created             │ Progress     │ Status   │ Contact                 │",
    );
    console.log(
      "├────────────────────┼─────────────────────┼──────────────┼──────────┼─────────────────────────┤",
    );

    for (const session of sessions) {
      const sessionId = session.sessionId.slice(0, 18).padEnd(18);
      const created = new Date(session.createdAt)
        .toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        .padEnd(19);
      const progress = `${session.progressCount} Q`.padEnd(12);
      const status = (session.hasCompletion ? "Complete" : "In Progress").padEnd(10);
      const contact = (session.contactEmail || "—").slice(0, 23).padEnd(23);

      console.log(`│ ${sessionId} │ ${created} │ ${progress} │ ${status} │ ${contact} │`);
    }

    console.log(
      "└────────────────────┴─────────────────────┴──────────────┴──────────┴─────────────────────────┘",
    );

    console.log(`\n💡 Use 'intake archive view <session-id>' to view details`);
  },
});

const viewCommand = defineCommand({
  meta: {
    name: "view",
    description: "View a specific archived intake session",
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
    const sessionData = await getSessionData(sessionId);

    if (!sessionData) {
      console.error(`❌ Session not found: ${sessionId}`);
      process.exit(1);
    }

    if (args.format === "json") {
      console.log(JSON.stringify(sessionData, null, 2));
      return;
    }

    // Text format
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📄 Intake Session: ${sessionData.sessionId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`📋 Intake Type: ${sessionData.metadata.intakeType}`);
    console.log(`⏰ Created: ${new Date(sessionData.metadata.createdAt).toLocaleString()}`);
    if (sessionData.metadata.completedAt) {
      console.log(`✅ Completed: ${new Date(sessionData.metadata.completedAt).toLocaleString()}`);
    } else {
      console.log("⏳ Status: In Progress");
    }

    // Contact Information
    if (sessionData.contact) {
      console.log(`\n${"─".repeat(60)}`);
      console.log("👤 Contact Information");
      console.log("─".repeat(60));
      if (sessionData.contact.email) {
        console.log(`📧 Email: ${sessionData.contact.email}`);
      }
      if (sessionData.contact.phone) {
        console.log(`📱 Phone: ${sessionData.contact.phone}`);
      }
      console.log(`⏰ Saved: ${new Date(sessionData.contact.timestamp).toLocaleString()}`);
    }

    // Progress (Questions & Answers)
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📝 Progress (${sessionData.progress.length} Questions Answered)`);
    console.log("─".repeat(60));

    for (const [index, entry] of sessionData.progress.entries()) {
      console.log(`\nQ${index + 1}: ${entry.questionId}`);
      console.log(
        `Answer: ${Array.isArray(entry.answer) ? entry.answer.join(", ") : entry.answer}`,
      );
      if (entry.reflection) {
        console.log(`💭 Reflection: ${entry.reflection}`);
      }
      console.log(`⏰ ${new Date(entry.timestamp).toLocaleString()}`);
    }

    // Completion Outputs
    if (sessionData.completion) {
      console.log(`\n${"─".repeat(60)}`);
      console.log("🎯 Completion Outputs");
      console.log("─".repeat(60));

      console.log("\n📄 Personalized Brief:");
      console.log(sessionData.completion.outputs.personalizedBrief);

      console.log("\n📋 First Session Guide:");
      console.log(sessionData.completion.outputs.firstSessionGuide);

      console.log("\n🧪 Experiments:");
      for (const [index, experiment] of sessionData.completion.outputs.experiments.entries()) {
        console.log(`${index + 1}. ${experiment}`);
      }

      console.log(`\n⏰ Generated: ${new Date(sessionData.completion.timestamp).toLocaleString()}`);
    }

    // Interactions
    if (sessionData.interactions.length > 0) {
      console.log(`\n${"─".repeat(60)}`);
      console.log(`🖱️  Interactions (${sessionData.interactions.length})`);
      console.log("─".repeat(60));

      for (const interaction of sessionData.interactions) {
        console.log(`• ${interaction.type} at ${new Date(interaction.timestamp).toLocaleString()}`);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  },
});

export const archiveCommand = defineCommand({
  meta: {
    name: "archive",
    description: "View archived intake sessions",
  },
  subCommands: {
    list: listCommand,
    view: viewCommand,
  },
});
