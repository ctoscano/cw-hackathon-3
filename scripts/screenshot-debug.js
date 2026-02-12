// scripts/screenshot-debug.js
// Debug script to capture console logs and check WebGL support

const { firefox } = require("playwright");

async function debugScreenshot(url, outputPath = "debug-screenshot.png") {
  const browser = await firefox.launch({
    headless: true,
    firefoxUserPrefs: {
      // Enable WebGL in headless mode
      "webgl.disabled": false,
      "webgl.force-enabled": true,
      "layers.acceleration.force-enabled": true,
    },
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  // Capture page errors
  const pageErrors = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Check WebGL support
    const webglInfo = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        return { supported: false, reason: "WebGL context creation failed" };
      }
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "unknown",
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown",
      };
    });

    // Check if canvas exists on page
    const canvasInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas");
      return {
        count: canvases.length,
        sizes: Array.from(canvases).map((c) => ({ width: c.width, height: c.height })),
      };
    });

    // Wait for potential WebGL rendering
    await page.waitForTimeout(3000);

    await page.screenshot({ path: outputPath });

    console.log("\n=== Debug Report ===");
    console.log("\nWebGL Info:", JSON.stringify(webglInfo, null, 2));
    console.log("\nCanvas Elements:", JSON.stringify(canvasInfo, null, 2));
    console.log("\nConsole Logs:");
    for (const log of consoleLogs) {
      console.log(`  [${log.type}] ${log.text}`);
    }
    if (pageErrors.length > 0) {
      console.log("\nPage Errors:");
      for (const err of pageErrors) {
        console.log(`  ERROR: ${err}`);
      }
    }
    console.log(`\nScreenshot saved to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

const [, , url, output] = process.argv;
if (!url) {
  console.log("Usage: node screenshot-debug.js <url> [output.png]");
  process.exit(1);
}
debugScreenshot(url, output || "debug-screenshot.png");
