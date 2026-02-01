# Voice-Enabled Therapy Intake Page - Product Requirement Document

## Purpose

This PRD defines the implementation of a voice-enabled therapy intake experience at `/why-therapy` using Pipecat by Daily. The goal is to create a conversational interface where users can speak their responses while an AI chatbot guides them through the intake questionnaire, making the experience more natural and accessible than traditional form-filling. This addresses the need for a more human-like, less intimidating way to explore therapy readiness while maintaining the structured data collection of the existing intake flow.

## Constraints

### Technical Constraints
- Must use Next.js 15 App Router (project standard)
- Must integrate Pipecat client SDK (@pipecat-ai/client-react) for voice handling
- Must use Daily as the WebRTC transport layer (@pipecat-ai/daily-transport)
- Backend bot service required - can use Daily's hosted Pipecat or self-hosted
- Browser must support WebRTC and microphone access
- Must handle microphone permission gracefully

### Business/Timeline Constraints
- Hackathon timeline - prioritize MVP functionality over polish
- Daily API key required for transport layer
- Pipecat backend service needs to be configured/deployed

### Dependencies
- Daily account and API key
- Pipecat backend service (Python) for bot logic
- Existing intake question definitions from `@cw-hackathon/data` package
- Modern browser with WebRTC support

### Compatibility Requirements
- Must work on Chrome, Firefox, Safari, Edge (latest versions)
- Must provide fallback for browsers without microphone support
- Must gracefully handle microphone permission denial
- Mobile browser support (responsive design)

## Technical Requirements

### Files to Create

1. **`apps/web/app/why-therapy/page.tsx`** - Server component page wrapper
   - Page metadata for SEO
   - Import and render VoiceIntakeClient component
   - Simple layout structure

2. **`apps/web/app/why-therapy/voice-intake-client.tsx`** - Main client component
   - "use client" directive for client-side rendering
   - PipecatClientProvider setup with Daily transport
   - Microphone permission handling
   - Connection state management
   - Chat history display
   - Voice activity indicators

3. **`apps/web/app/why-therapy/why-therapy.module.css`** - Page styling
   - Conversation transcript layout
   - Voice activity indicator styles
   - Connection status styles
   - Responsive design for mobile
   - Accessibility considerations

4. **`apps/web/app/api/pipecat/route.ts`** - API route for bot connection
   - Generate Daily room and token
   - Return connection credentials for client
   - Handle authentication/authorization

5. **`packages/data/src/lib/pipecat/intake-bot-config.ts`** - Bot configuration
   - System prompt for intake conversation
   - Question flow configuration
   - Response handling logic
   - Structured output definitions

### Files to Modify

1. **`apps/web/package.json`** - Add Pipecat dependencies
   - Add @pipecat-ai/client-js
   - Add @pipecat-ai/client-react
   - Add @pipecat-ai/daily-transport

2. **`apps/web/app/page.tsx`** - Add link to /why-therapy
   - Add navigation link to voice intake page

3. **`packages/data/src/index.ts`** - Export bot config
   - Export intake bot configuration

### Architecture Decisions

**Client-Server Architecture:**
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Daily WebRTC   │────▶│  Pipecat Bot    │
│  (React Client) │◀────│   (Transport)    │◀────│   (Python)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                 │
        │ HTTP                                           │
        ▼                                                ▼
┌─────────────────┐                          ┌─────────────────┐
│  /api/pipecat   │                          │  LLM + TTS/STT  │
│  (credentials)  │                          │   (AI Services) │
└─────────────────┘                          └─────────────────┘
```

**Voice Flow:**
1. User clicks "Start Conversation"
2. Client requests credentials from `/api/pipecat`
3. Client connects to Daily room via Pipecat SDK
4. Bot greets user and asks first question
5. User speaks response (STT converts to text)
6. Bot processes response, provides reflection, asks next question (TTS)
7. Conversation continues until intake complete
8. Final summary and recommendations displayed

**State Management:**
- Pipecat client handles connection and media state
- React state for chat history and UI
- No persistent storage - session-based only

### Tech Stack

- **@pipecat-ai/client-js** (^1.0.0) - Core Pipecat client SDK
- **@pipecat-ai/client-react** (^1.0.0) - React hooks and providers
- **@pipecat-ai/daily-transport** (^1.0.0) - Daily WebRTC transport

Backend (separate deployment):
- **pipecat** (Python) - Bot framework
- **daily-python** - Daily Python SDK
- LLM provider (Claude, OpenAI, etc.)
- TTS provider (ElevenLabs, Deepgram, etc.)
- STT provider (Deepgram, AssemblyAI, etc.)

### Data Models

```typescript
// Message in conversation transcript
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  questionId?: string; // Links to intake question if applicable
}

// Bot connection config from API
interface BotConnectionConfig {
  roomUrl: string;
  token: string;
  botId: string;
}

// Pipecat client configuration
interface PipecatClientConfig {
  transport: DailyTransport;
  enableMic: boolean;
  enableCam: boolean;
  callbacks?: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onBotReady?: () => void;
    onTranscript?: (transcript: TranscriptMessage) => void;
  };
}
```

## Steps

### Step 1: Add Pipecat Dependencies

**Action**: Install Pipecat client SDK and Daily transport packages to the web app

**Requirements**:
- Add @pipecat-ai/client-js to dependencies
- Add @pipecat-ai/client-react to dependencies
- Add @pipecat-ai/daily-transport to dependencies
- Run pnpm install to update lockfile

**Verification**:
```bash
# Check packages are installed
cat apps/web/package.json | grep pipecat

# Expected output:
# "@pipecat-ai/client-js": "...",
# "@pipecat-ai/client-react": "...",
# "@pipecat-ai/daily-transport": "..."
```

**Implementation Log**:
- [ ] Add dependencies to package.json
- [ ] Run pnpm install
- [ ] Verify packages resolve correctly

### Step 2: Create API Route for Bot Connection

**Action**: Create API endpoint that returns Daily room credentials for Pipecat client

**Requirements**:
- POST endpoint at `/api/pipecat`
- For MVP: Return mock/demo credentials or integrate with Daily REST API
- Handle errors gracefully
- Return roomUrl and token

**Verification**:
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/pipecat

# Expected output (JSON):
# { "roomUrl": "...", "token": "..." }
```

**Implementation Log**:
- [ ] Create route.ts file
- [ ] Implement credential generation/fetching
- [ ] Add error handling
- [ ] Test endpoint locally

### Step 3: Create Voice Intake Page Structure

**Action**: Create the /why-therapy page with server component and basic layout

**Requirements**:
- Server component at `app/why-therapy/page.tsx`
- Page metadata (title, description)
- Import VoiceIntakeClient component
- Basic page structure with header

**Verification**:
```bash
# Page file exists
ls -la apps/web/app/why-therapy/page.tsx

# Navigate to page in browser
# http://localhost:3000/why-therapy
```

**Implementation Log**:
- [ ] Create why-therapy directory
- [ ] Create page.tsx with metadata
- [ ] Add basic layout structure
- [ ] Verify page renders

### Step 4: Implement Voice Intake Client Component

**Action**: Create the main client component with Pipecat integration

**Requirements**:
- "use client" directive
- PipecatClientProvider setup
- Daily transport configuration
- Microphone permission handling
- Connection button and state display
- Voice activity indicator
- Chat transcript display
- Handle bot messages and user transcriptions
- Graceful error handling for permissions/connection

**Verification**:
```bash
# Component file exists
ls -la apps/web/app/why-therapy/voice-intake-client.tsx

# Manual testing:
# 1. Navigate to /why-therapy
# 2. Click "Start Conversation"
# 3. Grant microphone permission
# 4. Verify connection to bot
# 5. Speak and verify transcription appears
```

**Implementation Log**:
- [ ] Create voice-intake-client.tsx
- [ ] Set up PipecatClientProvider
- [ ] Implement microphone permission flow
- [ ] Add connection state management
- [ ] Implement chat transcript display
- [ ] Add voice activity indicators
- [ ] Test full conversation flow

### Step 5: Create Page Styling

**Action**: Add CSS module for voice intake page styling

**Requirements**:
- Clean, calming design appropriate for therapy context
- Conversation transcript with clear speaker distinction
- Voice activity/speaking indicators
- Connection status display
- Responsive design for mobile
- Loading and error states

**Verification**:
```bash
# CSS file exists
ls -la apps/web/app/why-therapy/why-therapy.module.css

# Visual inspection in browser
# - Desktop layout looks correct
# - Mobile layout is usable
# - All states have appropriate styling
```

**Implementation Log**:
- [ ] Create CSS module
- [ ] Style conversation transcript
- [ ] Add voice indicator animations
- [ ] Implement responsive breakpoints
- [ ] Style loading/error states

### Step 6: Add Navigation Link

**Action**: Add link to /why-therapy from the home page

**Requirements**:
- Add clear call-to-action link on home page
- Brief description of voice intake feature
- Maintain existing page structure

**Verification**:
```bash
# Link exists in home page
grep -i "why-therapy" apps/web/app/page.tsx

# Expected: Link to /why-therapy route
```

**Implementation Log**:
- [ ] Add link to home page
- [ ] Add description text
- [ ] Verify navigation works

### Step 7: Create Bot Configuration (Data Package)

**Action**: Create intake bot configuration in the data package

**Requirements**:
- System prompt for conversational intake
- Question definitions for bot to follow
- Reflection generation guidelines
- Completion handling

**Verification**:
```bash
# Config file exists
ls -la packages/data/src/lib/pipecat/intake-bot-config.ts

# Export works
grep "intake-bot-config" packages/data/src/index.ts
```

**Implementation Log**:
- [ ] Create pipecat directory in data package
- [ ] Create intake-bot-config.ts
- [ ] Define system prompt
- [ ] Export from index.ts

## Completion Criteria

- [ ] /why-therapy page loads without errors
- [ ] Microphone permission flow works correctly
- [ ] Client can connect to Pipecat/Daily (with mock or real backend)
- [ ] Voice input is transcribed and displayed
- [ ] Bot responses are displayed (requires backend)
- [ ] Responsive design works on mobile
- [ ] Navigation from home page works

## Notes

### MVP Scope

For hackathon MVP, the following simplifications are acceptable:
- Use Daily's demo room for testing client-side flow
- Bot backend can be mocked or use a simple echo bot
- Full intake question flow not required - demonstrate voice conversation capability
- Completion/summary view can be simplified

### Future Enhancements

- Full Pipecat backend deployment with Claude LLM
- Persist conversation transcripts
- Integration with existing intake data structures
- Multi-language support via different TTS/STT voices
- Video support for visual cues
- Session resumption if disconnected

### Backend Deployment Options

1. **Daily Bots (Recommended for MVP)**: Use Daily's hosted bot infrastructure
2. **Self-hosted**: Deploy Python Pipecat bot on Railway, Fly.io, or similar
3. **Serverless**: Use modal.com or similar for on-demand bot instances

### Related Resources

- [Pipecat Documentation](https://docs.pipecat.ai/)
- [Daily Documentation](https://docs.daily.co/)
- [Pipecat GitHub](https://github.com/pipecat-ai/pipecat)
- [Pipecat Client React](https://www.npmjs.com/package/@pipecat-ai/client-react)

### Gotchas & Surprises

- Pipecat SDK v1.0 uses `PipecatClientOptions` not `RTVIClientOptions` - check package types
- Error events receive `RTVIMessage` objects with error data in the `data` property
- `startBotAndConnect()` requires an `APIRequest` object with `endpoint` property
- Demo mode is essential for testing UI without backend - allows text input fallback

### Demo Instructions

**How to Demo:**

1. **Start the dev server:**
   ```bash
   cd /home/user/cw-hackathon-3
   pnpm dev
   ```

2. **Navigate to the page:**
   - Open http://localhost:3000
   - Click "Why Therapy? (Voice Guided)" card
   - Or navigate directly to http://localhost:3000/why-therapy

3. **Test demo mode (no Daily API key needed):**
   - Click "Start Voice Conversation"
   - Allow microphone access when prompted
   - You'll see a system message about demo mode
   - Type messages in the text input to simulate conversation
   - Bot will respond with simulated therapy guidance

4. **Test production mode (requires Daily API):**
   - Set environment variables in `.env.local`:
     ```
     DAILY_API_KEY=your-key
     PIPECAT_BOT_URL=your-bot-url
     DAILY_ROOM_URL=your-room-url
     ```
   - Start dev server and navigate to /why-therapy
   - Click "Start Voice Conversation"
   - Speak naturally and see transcriptions appear
   - Bot should respond with voice

---

**Status**: In Progress
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
**Implementation Started**: 2026-02-01
**Completed**: N/A (Backend bot service not yet deployed)
