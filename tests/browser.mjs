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
const baseURL = new URL(process.env.BASE_URL || "http://127.0.0.1:3000/").href;
const errors = [];
let checks = 0;
function check(label) {
  checks++;
  console.log(`PASS ${label}`);
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(new URL("?test", baseURL).href);
  await page.screenshot({
    path: `${screenshotDir}/01-opening-en.png`,
    fullPage: true,
  });
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "One street from home.",
  );
  assert.equal(await page.locator("#game").getAttribute("width"), "960");
  assert.equal(await page.locator("#game").getAttribute("height"), "716");
  const playerVisibleAtOpening = await page.evaluate(() => {
    const c = document.querySelector("#game").getBoundingClientRect();
    const card = document
      .querySelector(".overlay-card")
      .getBoundingClientRect();
    const x = c.left + (640 / 960) * c.width,
      y = c.top + ((76 + 532 - 25) / 716) * c.height;
    return !(
      x >= card.left &&
      x <= card.right &&
      y >= card.top &&
      y <= card.bottom
    );
  });
  assert.ok(
    playerVisibleAtOpening,
    "Opening instructions leave the character visible",
  );
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(4));
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "playing");
  await page.screenshot({
    path: `${screenshotDir}/02-playing-en.png`,
    fullPage: true,
  });
  check("English opening, dominant Canvas scene and normal traffic");
  const before = await page.evaluate(() => window.p0Test.game.time);
  await page.locator("#language").click();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-TW");
  assert.equal(await page.evaluate(() => window.p0Test.game.time), before);
  assert.equal(await page.locator("#signal-label").textContent(), "紅燈");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-TW");
  await page.screenshot({
    path: `${screenshotDir}/03-opening-zh-TW.png`,
    fullPage: true,
  });
  check(
    "Immediate language switching preserves time; language survives reload",
  );
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(18.05));
  assert.equal(await page.locator("#signal-label").textContent(), "綠燈");
  await page.evaluate(() => window.p0Test.advance(3.3, { up: true }));
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
  check("Successful crossing and exact completion copy in both languages");
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(22));
  const runner = await page.evaluate(() =>
    window.p0Test.game.vehicles.find((v) => v.violator),
  );
  assert.ok(runner.x > 326 && runner.x < 640);
  assert.equal(
    await page.locator("#hazard-panel, #street-message, aside").count(),
    0,
  );
  assert.ok(!(await page.locator("body").innerText()).includes("scooter"));
  await page.screenshot({
    path: `${screenshotDir}/05-observation-no-warning.png`,
    fullPage: true,
  });
  check(
    "Red-light violation remains observable; no predictive warning or sidebar",
  );
  await page.locator("#restart").click();
  await page.evaluate(() => {
    window.p0Test.advance(21);
    window.p0Test.advance(3.3, { up: true });
  });
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "failed");
  assert.equal(await page.locator("#overlay-title").textContent(), "YOU DIED");
  assert.ok(
    await page
      .locator("#overlay")
      .evaluate((el) => el.classList.contains("death")),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: `${screenshotDir}/06-death-en.png`,
    fullPage: true,
  });
  assert.ok(!(await page.locator("#overlay").innerText()).includes("歹勢"));
  await page.locator("#language").click();
  assert.equal(
    await page.locator("#overlay-title").textContent(),
    "歹勢，你鼠翹翹了",
  );
  await page.screenshot({
    path: `${screenshotDir}/07-death-zh-TW.png`,
    fullPage: true,
  });
  assert.ok(!(await page.locator("#overlay").innerText()).includes("YOU DIED"));
  const headline = await page.locator("#overlay-title").evaluate((el) => ({
    font: parseFloat(getComputedStyle(el).fontSize),
    fits: el.scrollWidth <= el.clientWidth,
    height: el.getBoundingClientRect().height,
  }));
  assert.ok(
    headline.font >= 80 &&
      headline.fits &&
      headline.height <= headline.font * 1.4,
  );
  assert.ok(await page.locator("#action").isVisible());
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.p0Test.game.time), 0);
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "playing");
  check(
    "Large localized death headlines, selected language only, accessible retry with Enter",
  );
  await page.evaluate(() => {
    window.p0Test.advance(24);
    window.p0Test.advance(3.3, { up: true });
  });
  assert.equal(await page.evaluate(() => window.p0Test.game.status), "won");
  check("Waiting for the unannounced scooter to pass permits a safe crossing");
  // Render equivalence prevents flag-driven hazard markers from returning.
  const artCheck = await page.evaluate(async () => {
    const { createRenderer } = await import(
      new URL("src/render.js", location.href).href
    );
    const { createGame, createVehicle, playerBounds } = await import(
      "/src/model.js"
    );
    const { messages } = await import(
      new URL("src/i18n.js", location.href).href
    );
    const c = document.createElement("canvas");
    c.width = 960;
    c.height = 716;
    const r = createRenderer(c, (k) => messages.en[k]);
    const g = createGame();
    g.vehicles = [createVehicle("scooter", 0, { x: 500, y: 300 })];
    r.draw(g, "en");
    const normal = c.getContext("2d").getImageData(0, 0, 960, 716).data;
    g.vehicles[0].violator = true;
    r.draw(g, "en");
    const runner = c.getContext("2d").getImageData(0, 0, 960, 716).data;
    const same = normal.every((v, i) => v === runner[i]);
    // Put a bus across the character and verify the character remains the final layer.
    g.vehicles = [createVehicle("bus", 0, { x: 640, y: 532 })];
    r.draw(g, "en");
    const pixel = Array.from(
      c.getContext("2d").getImageData(636, 76 + 532 - 20, 1, 1).data,
    );
    return { same, pixel, bounds: playerBounds(g.player) };
  });
  assert.ok(
    artCheck.same,
    "Normal and violating scooters have identical artwork",
  );
  assert.deepEqual(artCheck.pixel.slice(0, 3), [66, 103, 162]);
  assert.deepEqual(artCheck.bounds, { x: 634, y: 527, w: 12, h: 11 });
  check(
    "No visual prediction from violator flag; enlarged player stays above vehicles with unchanged feet box",
  );
  await page.goto(baseURL);
  await page.locator("#action").click();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1100);
  await page.keyboard.up("ArrowUp");
  assert.ok(await page.locator("#overlay").isHidden());
  assert.equal(await page.evaluate(() => window.p0Test), undefined);
  const moved = await page.locator("#game").evaluate((c) => {
    const d = c.getContext("2d").getImageData(625, 76 + 370, 34, 150).data;
    for (let i = 0; i < d.length; i += 4)
      if (d[i] === 240 && d[i + 1] === 90 && d[i + 2] === 136) return true;
    return false;
  });
  assert.ok(moved);
  check("Real arrow-key movement into the road on a red pedestrian signal");
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
  assert.ok(frames >= 30);
  check(`Animation loop: ${frames} frames in one-second Chromium sample`);
  for (const width of [1280, 1024, 720]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await page.locator("#game").evaluate((c) => ({
      canvasWidth: c.getBoundingClientRect().width,
      screen: innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.ok(!layout.overflow && layout.canvasWidth >= layout.screen * 0.67);
  }
  check(
    "Street dominates desktop and compact layouts with no horizontal overflow",
  );
  await page.goto(new URL("?test", baseURL).href);
  await page.locator("#action").click();
  await page.evaluate(() => window.p0Test.advance(4));
  await page.screenshot({
    path: `${screenshotDir}/08-playing-720px.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 960, height: 716 });
  await page.route("**/sprite-review", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><body style="margin:0"></body>',
    }),
  );
  await page.goto(new URL("sprite-review", baseURL).href);
  await page.evaluate(async () => {
    const { createRenderer } = await import(
      new URL("src/render.js", location.href).href
    );
    const { messages } = await import(
      new URL("src/i18n.js", location.href).href
    );
    const c = document.createElement("canvas");
    c.width = 960;
    c.height = 716;
    document.body.replaceChildren(c);
    createRenderer(c, (k) => messages.en[k]).gallery();
  });
  await page.screenshot({
    path: `${screenshotDir}/09-directional-sprites.png`,
  });
  check("All 16 directional vehicle appearances render");
  assert.deepEqual(errors, []);
  check("No browser runtime, console or failed-request errors");
  console.log(`${checks} browser checks passed.`);
} finally {
  await browser.close();
}
