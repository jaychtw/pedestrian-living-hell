import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const screenshotDir = process.env.SCREENSHOT_DIR || "artifacts/screenshots";
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
let checks = 0;
function check(label) {
  checks++;
  console.log(`PASS ${label}`);
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1060 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:3000/?test");
  await page.screenshot({
    path: `${screenshotDir}/01-start-en.png`,
    fullPage: true,
  });
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "Home is just over there.",
  );
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(4));
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "playing");
  await page.screenshot({
    path: `${screenshotDir}/02-street-en.png`,
    fullPage: true,
  });
  check("English start flow, actual Canvas scene and normal traffic");
  const before = await page.evaluate(() => window.p0Test.game.time);
  await page.locator("#language").click();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-TW");
  assert.equal(await page.evaluate(() => window.p0Test.game.time), before);
  assert.equal(
    await page.locator("#signal-label").textContent(),
    "停下來，看看車",
  );
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-TW");
  await page.screenshot({
    path: `${screenshotDir}/03-start-zh-TW.png`,
    fullPage: true,
  });
  check(
    "Live Traditional Chinese toggle preserves game; language persists on reload",
  );
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(18.05));
  assert.equal(
    await page.locator("#signal-label").textContent(),
    "綠燈了，小心過",
  );
  await page.evaluate(() =>
    window.p0Test.advance(3.3, {
      up: true,
      down: false,
      left: false,
      right: false,
    }),
  );
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "won");
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "平安到家。",
  );
  await page.screenshot({
    path: `${screenshotDir}/04-home-safe-zh-TW.png`,
    fullPage: true,
  });
  await page.locator("#language").click();
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "Home safe.",
  );
  check("Cautious crossing succeeds and completion translates without reset");
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(22));
  assert.ok(
    await page
      .locator("#hazard-panel")
      .evaluate((el) => el.classList.contains("active")),
  );
  const runner = await page.evaluate(() =>
    window.p0Test.game.vehicles.find((v) => v.violator),
  );
  assert.ok(runner.x > 326 && runner.x < 640);
  await page.screenshot({
    path: `${screenshotDir}/05-observable-violation.png`,
    fullPage: true,
  });
  check(
    "Red-light scooter crosses stop line during WALK, with visible localized warning",
  );
  await page.locator("#restart").click();
  await page.evaluate(() => {
    window.p0Test.advance(21);
    window.p0Test.advance(3.3, { up: true });
  });
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "failed");
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "That was too close.",
  );
  await page.screenshot({
    path: `${screenshotDir}/06-failure.png`,
    fullPage: true,
  });
  await page.locator("#language").click();
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "這次，沒能平安通過。",
  );
  await page.locator("#action").click();
  assert.equal(await page.evaluate(() => window.p0Test.game.time), 0);
  check("Reproducible collision, bilingual failure, retry resets the scenario");
  // Real keyboard events in normal requestAnimationFrame mode, rather than test hooks.
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#action").click();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1100);
  await page.keyboard.up("ArrowUp");
  const pixel = await page
    .locator("#game")
    .evaluate((c) =>
      Array.from(c.getContext("2d").getImageData(640, 532, 1, 1).data),
    );
  assert.ok(await page.locator("#overlay").isHidden());
  assert.equal(await page.evaluate(() => window.p0Test), undefined);
  // Recover state for verification by observing player-colored pixels in the actual canvas.
  const playerMoved = await page.locator("#game").evaluate((c) => {
    const d = c.getContext("2d").getImageData(633, 395, 14, 120).data;
    for (let i = 0; i < d.length; i += 4)
      if (d[i] === 215 && d[i + 1] === 148 && d[i + 2] === 75) return true;
    return false;
  });
  assert.ok(
    playerMoved,
    `Keyboard moved amber player into the road (${pixel})`,
  );
  check(
    "Real arrow-key input moves the player into road on a red pedestrian signal",
  );
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let count = 0;
        const start = performance.now();
        function sample() {
          count++;
          if (performance.now() - start >= 1000) resolve(count);
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }),
  );
  assert.ok(frames >= 30, `Observed ${frames} animation frames in one second`);
  check(`Animation loop: ${frames} frames in one second in headless Chromium`);
  await page.setViewportSize({ width: 720, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  check("Compact layout has no horizontal overflow");
  await page.setViewportSize({ width: 960, height: 640 });
  await page.route("**/sprite-review", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><body style="margin:0"></body>',
    }),
  );
  await page.goto("http://127.0.0.1:3000/sprite-review");
  await page.evaluate(async () => {
    const { createRenderer } = await import("/src/render.js");
    const { messages } = await import("/src/i18n.js");
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 640;
    document.body.replaceChildren(canvas);
    document.body.style.margin = "0";
    createRenderer(canvas, (k) => messages.en[k]).gallery();
  });
  await page.screenshot({
    path: `${screenshotDir}/07-directional-sprites.png`,
  });
  check("All 16 class/direction sprite combinations render");
  assert.deepEqual(errors, []);
  check("No browser runtime or console errors");
  console.log(`${checks} browser checks passed.`);
} finally {
  await browser.close();
}
