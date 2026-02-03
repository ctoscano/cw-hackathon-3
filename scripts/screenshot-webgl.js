#!/usr/bin/env node
/**
 * Screenshot script with software WebGL rendering
 * Uses Firefox with Mesa llvmpipe for software-rendered WebGL
 */

import { firefox } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = join(process.cwd(), "screenshots");

// Pages to screenshot
const PAGES = [
  { path: "/shader_demo", name: "shader-demo" },
  { path: "/landscapes/mountain", name: "mountain" },
  { path: "/landscapes/ocean", name: "ocean" },
  { path: "/landscapes/forest", name: "forest" },
];

async function main() {
  // Create screenshot directory
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  console.log("Launching Firefox with software WebGL rendering...");

  // Launch Firefox with WebGL preferences for software rendering
  // Use headed mode with Xvfb for WebGL support
  const useHeaded = !!process.env.DISPLAY;
  console.log(`Mode: ${useHeaded ? "headed (Xvfb)" : "headless"}`);

  const browser = await firefox.launch({
    headless: !useHeaded,
    firefoxUserPrefs: {
      // Force WebGL to be enabled
      "webgl.disabled": false,
      "webgl.force-enabled": true,
      // Use software rendering
      "webgl.prefer-native-gl": false,
      "layers.acceleration.force-enabled": false,
      // Disable hardware acceleration to force software path
      "gfx.webrender.all": false,
      "gfx.canvas.accelerated": false,
      // Allow WebGL in headless mode
      "webgl.enable-webgl2": true,
    },
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Check WebGL support
  await page.goto(`${BASE_URL}/shader_demo`);

  const webglInfo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { supported: false };

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      supported: true,
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown",
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown",
    };
  });

  console.log("WebGL Info:", webglInfo);

  if (!webglInfo.supported) {
    console.error("WebGL is not supported in this browser configuration");
    await browser.close();
    process.exit(1);
  }

  // Take screenshots
  for (const { path, name } of PAGES) {
    console.log(`Capturing ${name}...`);

    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });

    // Wait for shader to render (give it time to initialize and render a few frames)
    await page.waitForTimeout(2000);

    const screenshotPath = join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Saved: ${screenshotPath}`);
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to:", SCREENSHOT_DIR);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
