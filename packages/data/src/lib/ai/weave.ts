import * as weave from "weave";

/** Whether weave has been initialized */
let initialized = false;

/** Promise for the initialization (to avoid multiple concurrent initializations) */
let initPromise: Promise<void> | null = null;

/**
 * Get the Weave project name from environment variables.
 * Looks for WEAVE_PROJECT or WANDB_PROJECT environment variables.
 *
 * @returns The project name (format: "team/project" or just "project")
 */
function getWeaveProject(): string | undefined {
  return process.env.WEAVE_PROJECT || process.env.WANDB_PROJECT || process.env.CORE_WEAVE;
}

/**
 * Check if Weave tracing is enabled.
 * Weave is enabled when a project name is configured via environment variables.
 */
export function isWeaveEnabled(): boolean {
  return !!getWeaveProject();
}

/**
 * Initialize Weave for tracing.
 * This is a no-op if Weave is already initialized or if no project is configured.
 *
 * Call this at the start of your application or before making LLM calls.
 */
export async function initWeave(): Promise<void> {
  if (initialized) {
    return;
  }

  // If already initializing, wait for that to complete
  if (initPromise) {
    return initPromise;
  }

  const project = getWeaveProject();
  if (!project) {
    console.log("[Weave] Tracing disabled - set WEAVE_PROJECT or WANDB_PROJECT to enable");
    return;
  }

  initPromise = (async () => {
    try {
      await weave.init(project);
      initialized = true;
      console.log(`[Weave] Initialized with project: ${project}`);
    } catch (error) {
      console.error("[Weave] Failed to initialize:", error);
      // Don't throw - allow the app to continue without tracing
    }
  })();

  return initPromise;
}

/**
 * Wrap a function with Weave tracing.
 * If Weave is not enabled/initialized, returns the original function.
 *
 * @param fn The function to wrap
 * @param name Optional name for the operation (defaults to function name)
 * @returns The wrapped function (or original if Weave is disabled)
 */
export function wrapWithWeave<T extends (...args: unknown[]) => unknown>(fn: T, name?: string): T {
  if (!isWeaveEnabled()) {
    return fn;
  }

  // Use weave.op to wrap the function for automatic tracing
  const wrappedFn = weave.op(fn, { name: name || fn.name });
  return wrappedFn as T;
}

// Re-export weave.op for direct usage if needed
export { weave };
