import { NextResponse } from "next/server";

/**
 * POST /api/pipecat
 *
 * Returns connection credentials for the Pipecat voice bot.
 * In production, this would:
 * 1. Create a Daily room (or use a pool of rooms)
 * 2. Generate a meeting token
 * 3. Start/connect to a Pipecat bot instance
 *
 * For MVP/demo, we return placeholder configuration that can work with
 * Daily's demo infrastructure or a locally running Pipecat bot.
 */
export async function POST(request: Request) {
  try {
    // Parse optional configuration from request body
    const body = await request.json().catch(() => ({}));
    const { intakeType = "therapy_readiness" } = body;

    // In production, you would:
    // 1. Call Daily REST API to create a room
    // 2. Generate a meeting token with appropriate permissions
    // 3. Start or connect to a Pipecat bot service

    // For MVP, check for environment variables
    const dailyApiKey = process.env.DAILY_API_KEY;
    const pipecatBotUrl = process.env.PIPECAT_BOT_URL;

    if (dailyApiKey && pipecatBotUrl) {
      // Production mode: Create room and get real credentials
      // This is where you'd integrate with Daily's REST API
      // and your Pipecat bot service

      // Example production flow:
      // const room = await createDailyRoom(dailyApiKey);
      // const token = await createMeetingToken(dailyApiKey, room.name);
      // const bot = await startPipecatBot(pipecatBotUrl, room.url, intakeType);

      return NextResponse.json({
        roomUrl: process.env.DAILY_ROOM_URL || "",
        token: process.env.DAILY_TOKEN || "",
        botId: "voice-intake-bot",
        config: {
          intakeType,
          enableMic: true,
          enableCam: false,
        },
      });
    }

    // Demo mode: Return mock configuration for local development
    // The client can use this to test the UI flow
    return NextResponse.json({
      roomUrl: process.env.DAILY_ROOM_URL || "https://your-domain.daily.co/demo-room",
      token: process.env.DAILY_TOKEN || "",
      botId: "demo-bot",
      config: {
        intakeType,
        enableMic: true,
        enableCam: false,
      },
      // Flag to indicate this is demo mode
      isDemo: true,
      message:
        "Running in demo mode. Set DAILY_API_KEY and PIPECAT_BOT_URL environment variables for production.",
    });
  } catch (error) {
    console.error("Error in /api/pipecat:", error);
    return NextResponse.json({ error: "Failed to initialize voice session" }, { status: 500 });
  }
}

/**
 * GET /api/pipecat
 *
 * Health check endpoint that returns configuration status
 */
export async function GET() {
  const hasConfig = !!(process.env.DAILY_API_KEY && process.env.PIPECAT_BOT_URL);

  return NextResponse.json({
    status: "ok",
    configured: hasConfig,
    mode: hasConfig ? "production" : "demo",
  });
}
