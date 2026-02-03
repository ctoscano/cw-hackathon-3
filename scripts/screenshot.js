// scripts/screenshot.js
// Usage: node scripts/screenshot.js <url> [output-filename]
// Example: node scripts/screenshot.js http://localhost:3000 homepage.png

const { firefox } = require("playwright");

async function takeScreenshot(url, outputPath = "screenshot.png", options = {}) {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Optional: wait for specific selector if provided
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    // Wait a bit extra for WebGL to render
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: outputPath,
      fullPage: options.fullPage || false,
    });

    console.log(`Screenshot saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Screenshot failed:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// CLI usage
if (require.main === module) {
  const [, , url, output] = process.argv;
  if (!url) {
    console.log("Usage: node screenshot.js <url> [output.png]");
    process.exit(1);
  }
  takeScreenshot(url, output || "screenshot.png").catch(() => process.exit(1));
}

module.exports = { takeScreenshot };
