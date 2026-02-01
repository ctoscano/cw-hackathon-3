"use client";

import {
  PipecatClient,
  type PipecatClientOptions,
  RTVIEvent,
  type RTVIMessage,
} from "@pipecat-ai/client-js";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./why-therapy.module.css";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isFinal?: boolean;
}

interface BotConnectionConfig {
  roomUrl: string;
  token: string;
  botId: string;
  config: {
    intakeType: string;
    enableMic: boolean;
    enableCam: boolean;
  };
  isDemo?: boolean;
  message?: string;
}

type ConnectionState =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

export function VoiceIntakeClient() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);

  const clientRef = useRef<PipecatClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally trigger scroll when messages or transcript change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTranscript]);

  const addMessage = useCallback(
    (role: ConversationMessage["role"], content: string, isFinal = true) => {
      const message: ConversationMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role,
        content,
        timestamp: new Date(),
        isFinal,
      };
      setMessages((prev) => [...prev, message]);
      return message.id;
    },
    [],
  );

  const updateLastMessage = useCallback((content: string, isFinal: boolean) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      updated[lastIdx] = {
        ...updated[lastIdx],
        content,
        isFinal,
      };
      return updated;
    });
  }, []);

  const handleConnect = useCallback(async () => {
    setConnectionState("requesting-mic");
    setError(null);

    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release tracks immediately after getting permission
      for (const track of stream.getTracks()) {
        track.stop();
      }

      setConnectionState("connecting");

      // Get connection credentials from our API
      const response = await fetch("/api/pipecat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeType: "therapy_readiness" }),
      });

      if (!response.ok) {
        throw new Error("Failed to get connection credentials");
      }

      const config: BotConnectionConfig = await response.json();
      setIsDemo(config.isDemo || false);

      if (config.isDemo) {
        // Demo mode: simulate a conversation for UI testing
        setConnectionState("connected");
        addMessage(
          "system",
          "Running in demo mode. Voice features require Daily API configuration.",
        );

        // Simulate bot greeting
        setTimeout(() => {
          addMessage(
            "assistant",
            "Hello! I'm here to help you explore whether therapy might be right for you. This is a safe, judgment-free conversation. Would you like to start by telling me what's brought you here today?",
          );
        }, 1000);

        return;
      }

      // Production mode: Connect to real Pipecat bot
      const transport = new DailyTransport();

      const options: PipecatClientOptions = {
        transport,
        enableMic: config.config.enableMic,
        enableCam: config.config.enableCam,
      };

      const client = new PipecatClient(options);
      clientRef.current = client;

      // Set up event handlers
      client.on(RTVIEvent.Connected, () => {
        setConnectionState("connected");
        addMessage("system", "Connected to voice session");
      });

      client.on(RTVIEvent.Disconnected, () => {
        setConnectionState("disconnected");
        addMessage("system", "Voice session ended");
      });

      client.on(RTVIEvent.Error, (message: RTVIMessage) => {
        const errorData = message.data as { message?: string } | undefined;
        setError(errorData?.message || "An error occurred");
        setConnectionState("error");
      });

      // Handle user speech
      client.on(RTVIEvent.UserStartedSpeaking, () => {
        setIsUserSpeaking(true);
      });

      client.on(RTVIEvent.UserStoppedSpeaking, () => {
        setIsUserSpeaking(false);
      });

      // Handle bot speech
      client.on(RTVIEvent.BotStartedSpeaking, () => {
        setIsBotSpeaking(true);
      });

      client.on(RTVIEvent.BotStoppedSpeaking, () => {
        setIsBotSpeaking(false);
      });

      // Handle transcription
      client.on(RTVIEvent.UserTranscript, (transcript: { text: string; final: boolean }) => {
        if (transcript.final) {
          addMessage("user", transcript.text);
          setCurrentTranscript("");
        } else {
          setCurrentTranscript(transcript.text);
        }
      });

      // Handle bot responses
      client.on(RTVIEvent.BotTranscript, (transcript: { text: string }) => {
        addMessage("assistant", transcript.text);
      });

      // Connect to the session using startBotAndConnect
      await client.startBotAndConnect({
        endpoint: config.roomUrl,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect";

      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError(
          "Microphone access is required for voice conversation. Please allow microphone access and try again.",
        );
      } else {
        setError(errorMessage);
      }
      setConnectionState("error");
    }
  }, [addMessage]);

  const handleDisconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState("idle");
    setIsUserSpeaking(false);
    setIsBotSpeaking(false);
    setCurrentTranscript("");
  }, []);

  // Demo mode: Allow typing messages
  const [demoInput, setDemoInput] = useState("");

  const handleDemoSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!demoInput.trim() || !isDemo) return;

      addMessage("user", demoInput.trim());
      setDemoInput("");

      // Simulate bot response in demo mode
      setTimeout(() => {
        const responses = [
          "Thank you for sharing that with me. It takes courage to open up about these things. Can you tell me more about how this has been affecting your daily life?",
          "I hear you. What you're describing is something many people experience. What would you hope to gain from therapy if you decided to try it?",
          "That's really insightful. It sounds like you've been doing a lot of self-reflection. What do you think has been holding you back from seeking support?",
          "I appreciate you being so open. Based on what you've shared, it sounds like talking to a professional could be really beneficial. Is there anything specific that concerns you about starting therapy?",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage("assistant", randomResponse);
      }, 1500);
    },
    [demoInput, isDemo, addMessage],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Why Therapy?</h1>
        <p className={styles.subtitle}>
          A voice-guided exploration to help you understand if therapy might be helpful for you.
        </p>
      </header>

      {connectionState === "idle" && (
        <div className={styles.startSection}>
          <div className={styles.introCard}>
            <h2>How This Works</h2>
            <ul className={styles.introList}>
              <li>You'll have a natural voice conversation with an AI guide</li>
              <li>Speak freely about what's on your mind - there are no wrong answers</li>
              <li>The conversation is private and not recorded or stored</li>
              <li>
                At the end, you'll receive personalized insights about whether therapy might help
              </li>
            </ul>
            <p className={styles.micNote}>
              You'll need to allow microphone access to have a voice conversation.
            </p>
          </div>

          <button type="button" className={styles.startButton} onClick={handleConnect}>
            Start Voice Conversation
          </button>
        </div>
      )}

      {connectionState === "requesting-mic" && (
        <div className={styles.statusSection}>
          <div className={styles.spinner} />
          <p>Requesting microphone access...</p>
          <p className={styles.statusHint}>
            Please allow microphone access when prompted by your browser.
          </p>
        </div>
      )}

      {connectionState === "connecting" && (
        <div className={styles.statusSection}>
          <div className={styles.spinner} />
          <p>Connecting to voice session...</p>
        </div>
      )}

      {connectionState === "error" && (
        <div className={styles.errorSection}>
          <div className={styles.errorIcon}>!</div>
          <p className={styles.errorMessage}>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => setConnectionState("idle")}
          >
            Try Again
          </button>
        </div>
      )}

      {(connectionState === "connected" || connectionState === "disconnected") && (
        <div className={styles.conversationSection}>
          {/* Voice activity indicators */}
          {connectionState === "connected" && (
            <div className={styles.voiceIndicators}>
              <div className={`${styles.indicator} ${isUserSpeaking ? styles.speaking : ""}`}>
                <span className={styles.indicatorIcon}>You</span>
                {isUserSpeaking && <span className={styles.speakingLabel}>Speaking...</span>}
              </div>
              <div className={`${styles.indicator} ${isBotSpeaking ? styles.speaking : ""}`}>
                <span className={styles.indicatorIcon}>Guide</span>
                {isBotSpeaking && <span className={styles.speakingLabel}>Speaking...</span>}
              </div>
            </div>
          )}

          {/* Conversation transcript */}
          <div className={styles.transcript}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.messageRole}>
                  {msg.role === "user" ? "You" : msg.role === "assistant" ? "Guide" : "System"}
                </div>
                <div className={styles.messageContent}>{msg.content}</div>
              </div>
            ))}

            {/* Show current (partial) transcript */}
            {currentTranscript && (
              <div className={`${styles.message} ${styles.user} ${styles.partial}`}>
                <div className={styles.messageRole}>You</div>
                <div className={styles.messageContent}>{currentTranscript}...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Demo mode text input */}
          {isDemo && connectionState === "connected" && (
            <form onSubmit={handleDemoSubmit} className={styles.demoInputForm}>
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Type a message (demo mode)..."
                className={styles.demoInput}
              />
              <button type="submit" className={styles.demoSubmit} disabled={!demoInput.trim()}>
                Send
              </button>
            </form>
          )}

          {/* Control buttons */}
          <div className={styles.controls}>
            {connectionState === "connected" && (
              <button type="button" className={styles.endButton} onClick={handleDisconnect}>
                End Conversation
              </button>
            )}
            {connectionState === "disconnected" && (
              <button
                type="button"
                className={styles.startButton}
                onClick={() => {
                  setMessages([]);
                  setConnectionState("idle");
                }}
              >
                Start New Conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
