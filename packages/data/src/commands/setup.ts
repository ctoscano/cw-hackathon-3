import { defineCommand } from "citty";
import consola from "consola";
import { writeEnvFiles } from "../lib/setup/env-writer.js";

export const setupCommand = defineCommand({
  meta: {
    name: "setup",
    description: "Interactive setup wizard for environment configuration",
  },
  async run() {
    consola.box({
      title: "CW Hackathon Setup",
      message: "Configure environment variables for LLM provider and development",
      style: {
        borderColor: "blue",
      },
    });

    // Prompt for LLM provider
    const provider = await consola.prompt("LLM Provider:", {
      type: "select",
      options: [
        { value: "claude-code", label: "Claude Code (default)" },
        {
          value: "wandb-inference",
          label: "Weights & Biases Inference",
        },
      ],
    });

    let apiKey: string | undefined;
    // Only prompt for API key if using W&B
    if (provider === "wandb-inference") {
      apiKey = (await consola.prompt("WANDB_API_KEY:", {
        type: "text",
      })) as string;

      if (!apiKey || apiKey.trim() === "") {
        consola.error("WANDB_API_KEY is required for wandb-inference provider");
        return { success: false };
      }
    }

    // Optional Weave project
    const weaveProject = (await consola.prompt("WEAVE_PROJECT (optional, for tracing):", {
      type: "text",
      default: "",
    })) as string;

    // Port configuration
    const port = (await consola.prompt("PORT:", {
      type: "text",
      default: "3010",
    })) as string;

    // Prepare environment variables
    const envVars: {
      LLM_PROVIDER: string;
      WANDB_API_KEY?: string;
      WEAVE_PROJECT?: string;
      PORT: string;
    } = {
      LLM_PROVIDER: provider as string,
      PORT: port,
    };

    if (apiKey) {
      envVars.WANDB_API_KEY = apiKey;
    }

    if (weaveProject && weaveProject.trim() !== "") {
      envVars.WEAVE_PROJECT = weaveProject;
    }

    // Show summary
    consola.box({
      title: "Configuration Summary",
      message: Object.entries(envVars)
        .map(([key, value]) => {
          // Mask API key in display
          const displayValue =
            key === "WANDB_API_KEY" && value ? `${value.slice(0, 10)}...` : value;
          return `${key}: ${displayValue}`;
        })
        .join("\n"),
      style: {
        borderColor: "green",
      },
    });

    const confirm = await consola.prompt("Write configuration to .env files?", {
      type: "confirm",
      initial: true,
    });

    if (!confirm) {
      consola.info("Setup cancelled");
      return { success: false };
    }

    // Write env files
    try {
      writeEnvFiles(envVars);
      consola.success("Configuration saved!");

      consola.box({
        title: "Next Steps",
        message: [
          "Files created:",
          "  • apps/web/.env.local",
          "  • packages/data/.env",
          "",
          "Start development:",
          `  pnpm dev    # Starts on port ${port}`,
        ].join("\n"),
        style: {
          borderColor: "cyan",
        },
      });

      return { success: true };
    } catch (error) {
      consola.error("Failed to write configuration files:", error);
      return { success: false };
    }
  },
});
