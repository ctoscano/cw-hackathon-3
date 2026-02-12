// scripts/screenshot-viewports.js
// Takes screenshots at mobile, tablet, and desktop sizes
// Usage: node scripts/screenshot-viewports.js <url> [base-filename]

const { firefox } = require("playwright");

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

async function screenshotAllViewports(url, baseName = "screenshot") {
  const browser = await firefox.launch({ headless: true });
  const results = [];

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const outputPath = `${baseName}-${name}.png`;

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      // Wait for WebGL to render
      await page.waitForTimeout(2000);

      await page.screenshot({ path: outputPath });
      console.log(`  ${name} (${viewport.width}x${viewport.height}): ${outputPath}`);
      results.push({ name, viewport, path: outputPath, success: true });
    } catch (error) {
      console.error(`  ${name}: ${error.message}`);
      results.push({ name, viewport, success: false, error: error.message });
    }

    await context.close();
  }

  await browser.close();
  return results;
}

if (require.main === module) {
  const [, , url, baseName] = process.argv;
  if (!url) {
    console.log("Usage: node screenshot-viewports.js <url> [base-filename]");
    process.exit(1);
  }
  screenshotAllViewports(url, baseName || "screenshot");
}

module.exports = { screenshotAllViewports, VIEWPORTS };
