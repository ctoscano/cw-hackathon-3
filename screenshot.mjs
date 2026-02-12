import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--single-process",
    "--no-zygote",
  ],
  headless: true,
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto("http://localhost:3000/backgrounds", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "/home/user/cw-hackathon-3/screenshot-bg-aurora.png" });
  console.log("Aurora v2 screenshot saved");
} catch (e) {
  console.error("Error:", e.message);
}

// Click through tabs to screenshot each
const tabs = ["Iridescence", "Liquid Chrome", "Particles", "Lightning", "Waves"];
for (const tab of tabs) {
  try {
    await page.click(`button:has-text("${tab}")`);
    await page.waitForTimeout(2000);
    const fname = tab.toLowerCase().replace(/\s+/g, "-");
    await page.screenshot({ path: `/home/user/cw-hackathon-3/screenshot-bg-${fname}.png` });
    console.log(`${tab} screenshot saved`);
  } catch (e) {
    console.error(`${tab} error:`, e.message);
  }
}

await browser.close();
