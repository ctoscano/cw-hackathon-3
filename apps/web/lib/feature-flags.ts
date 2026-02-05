/**
 * Feature Flag System
 * Simple environment-based feature flags for development/production control
 */

type FeatureFlag = "ops_page";

/**
 * Feature flag configuration
 * Maps flag names to their enable/disable logic
 */
const flags: Record<FeatureFlag, () => boolean> = {
  /**
   * Ops page - Administrative interface for viewing archived data
   * Enabled in development, or explicitly enabled in production via env var
   */
  ops_page: () => {
    // Explicitly enabled via environment variable
    if (process.env.ENABLE_OPS_PAGE === "true") {
      return true;
    }

    // Always enabled in development
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    // Disabled by default in production
    return false;
  },
};

/**
 * Check if a feature flag is enabled
 *
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * ```ts
 * if (isFeatureEnabled('ops_page')) {
 *   // Show ops page
 * }
 * ```
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const checkFn = flags[flag];
  if (!checkFn) {
    console.warn(`Unknown feature flag: ${flag}`);
    return false;
  }
  return checkFn();
}

/**
 * Get all feature flags and their current status
 * Useful for debugging and admin interfaces
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return Object.fromEntries(
    Object.entries(flags).map(([key, checkFn]) => [key, checkFn()]),
  ) as Record<FeatureFlag, boolean>;
}
