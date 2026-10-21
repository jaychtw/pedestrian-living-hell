// Native Firefox WebDriver BiDi: no additional test dependency or patched engine.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
process.on("uncaughtExceptionMonitor", (error) => {
  if (process.env.GITHUB_ACTIONS === "true") {
    const detail = String(error.stack || error)
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.error(`::error title=Firefox release check::${detail}`);
  }
});

const executable =
  process.env.FIREFOX_PATH ||
  [
    "/usr/bin/firefox",
    "/usr/bin/firefox-esr",
    "/workspace/.cache/plh-firefox/runtime/usr/lib/firefox-esr/firefox-esr",
  ].find(existsSync);
assert.ok(
  executable,
  "Install Firefox or set FIREFOX_PATH to run the Firefox release checks.",
);
const baseURL = new URL(process.env.BASE_URL || "http://127.0.0.1:3000/").href;
const screenshots = process.env.SCREENSHOT_DIR || "artifacts/firefox";
const temporary = await mkdtemp(path.join(os.tmpdir(), "plh-firefox-"));
let child,
  socket,
  id = 0,
  context,
  checks = 0;
const pending = new Map(),
  errors = [];
async function command(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(Error(`${method} timed out`));
    }, 15000);
    pending.set(requestId, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command("script.evaluate", {
    expression: `(async()=>JSON.stringify(await (${expression})))()`,
    target: { context },
    awaitPromise: true,
  });
  if (result.type === "exception") throw Error(result.exceptionDetails.text);
  return JSON.parse(result.result.value ?? "null");
}
async function capture(name) {
  await evaluate(
    "Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>null))).then(()=>true)",
  );
  await evaluate(
    "new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))",
  );
  const result = await command("browsingContext.captureScreenshot", {
    context,
    origin: "viewport",
    format: { type: "image/png" },
  });
  await writeFile(
    path.join(screenshots, name),
    Buffer.from(result.data, "base64"),
  );
}
function pass(label) {
  console.log(`PASS Firefox: ${label}`);
  checks++;
}
try {
  await mkdir(screenshots, { recursive: true });
  for (const folder of ["profile", "cache", "config", "data"])
    await mkdir(path.join(temporary, folder));
  // Browser sandboxes cannot create nested namespaces in some CI containers.
  // This only configures the isolated headless test process, never the game.
  child = spawn(
    executable,
    [
      "--headless",
      "--no-remote",
      "--profile",
      path.join(temporary, "profile"),
      "--remote-debugging-port=0",
      "about:blank",
    ],
    {
      env: {
        ...process.env,
        XDG_CACHE_HOME: path.join(temporary, "cache"),
        XDG_CONFIG_HOME: path.join(temporary, "config"),
        XDG_DATA_HOME: path.join(temporary, "data"),
        MOZ_CRASHREPORTER_DISABLE: "1",
        MOZ_DISABLE_CONTENT_SANDBOX: "1",
        MOZ_DISABLE_RDD_SANDBOX: "1",
      },
    },
  );
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(Error(`Firefox startup timed out: ${output.slice(-1500)}`)),
      15000,
    );
    function read(chunk) {
      output += chunk;
      const match = output.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    }
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(Error(`Firefox exited ${code}: ${output.slice(-1500)}`));
    });
  });
  socket = new WebSocket(new URL("/session", endpoint));
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data),
      handler = pending.get(message.id);
    if (handler) {
      pending.delete(message.id);
      if (message.type === "error")
        handler.reject(Error(`${message.error}: ${message.message}`));
      else handler.resolve(message.result);
    } else if (
      message.method === "log.entryAdded" &&
      message.params.level === "error"
    )
      errors.push(message.params.text);
  });
  const session = await command("session.new", {
    capabilities: { alwaysMatch: { acceptInsecureCerts: false } },
  });
  console.log(`Firefox ${session.capabilities.browserVersion}`);
  await command("session.subscribe", { events: ["log.entryAdded"] });
  context = (await command("browsingContext.create", { type: "tab" })).context;
  await command("browsingContext.setViewport", {
    context,
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 1,
  });
  await command("browsingContext.navigate", {
    context,
    url: new URL("?test", baseURL).href,
    wait: "complete",
  });
  assert.equal(
    await evaluate('document.querySelector(".edition").textContent'),
    "v1.0",
  );
  assert.deepEqual(
    await evaluate(
      '({width:document.querySelector("#game").width,height:document.querySelector("#game").height})',
    ),
    { width: 1920, height: 1432 },
  );
  await evaluate('document.querySelector("#action").click()');
  await evaluate("window.p0Test.advance(4)");
  assert.equal(await evaluate("window.p0Test.game.status"), "playing");
  await capture("firefox-playing-en.png");
  pass("release loads and high-resolution Canvas renders");
  await evaluate('document.querySelector("#language").click()');
  assert.equal(await evaluate("document.documentElement.lang"), "zh-TW");
  assert.equal(await evaluate("window.p0Test.game.time>3.9"), true);
  await command("browsingContext.reload", { context, wait: "complete" });
  assert.equal(await evaluate("document.documentElement.lang"), "zh-TW");
  pass("immediate language switch and preference persistence");
  await evaluate('document.querySelector("#action").click()');
  await evaluate(
    "(()=>{window.p0Test.advance(21.7);window.p0Test.advance(3.3,{up:true});})()",
  );
  assert.equal(await evaluate("window.p0Test.game.status"), "failed");
  assert.equal(
    await evaluate('document.querySelector("#overlay-title").textContent'),
    "歹勢，你鼠翹翹了",
  );
  assert.equal(
    await evaluate(
      'getComputedStyle(document.querySelector("#overlay")).display',
    ),
    "grid",
  );
  await capture("firefox-death-zh-TW.png");
  assert.equal(
    await evaluate(
      'getComputedStyle(document.querySelector("#overlay")).opacity',
    ),
    "1",
  );
  await evaluate('document.querySelector("#language").click()');
  assert.equal(
    await evaluate('document.querySelector("#overlay-title").textContent'),
    "YOU DIED",
  );
  pass("collision and exact selected-language death messages");
  await evaluate('document.querySelector("#action").click()');
  assert.equal(await evaluate("window.p0Test.game.time"), 0);
  await evaluate(
    "(()=>{window.p0Test.advance(24);window.p0Test.advance(3.3,{up:true});})()",
  );
  assert.equal(
    await evaluate('document.querySelector("#overlay-title").textContent'),
    "Home safe.",
  );
  await capture("firefox-home-safe-en.png");
  await evaluate('document.querySelector("#language").click()');
  assert.equal(
    await evaluate('document.querySelector("#overlay-title").textContent'),
    "平安到家。",
  );
  pass("retry, waiting for violator and bilingual completion");
  await command("browsingContext.navigate", {
    context,
    url: baseURL,
    wait: "complete",
  });
  await evaluate('document.querySelector("#action").click()');
  await evaluate('document.querySelector("#language").click()');
  await command("input.performActions", {
    context,
    actions: [
      {
        type: "key",
        id: "keyboard",
        actions: [
          { type: "keyDown", value: "\uE013" },
          { type: "pause", duration: 1100 },
          { type: "keyUp", value: "\uE013" },
        ],
      },
    ],
  });
  const moved = await evaluate(
    '(()=>{const c=document.querySelector("#game");const d=c.getContext("2d").getImageData(1250,892,68,300).data;for(let i=0;i<d.length;i+=4)if(d[i]===240&&d[i+1]===90&&d[i+2]===136)return true;return false;})()',
  );
  assert.ok(moved);
  pass("real keyboard input works after a UI button takes focus");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth<=innerWidth"),
    true,
  );
  assert.equal(await evaluate('document.querySelector("#hazard-panel")'), null);
  pass("compact interface without predictive warnings or overflow");
  assert.deepEqual(errors, []);
  pass("no browser script or console errors");
  console.log(`${checks} Firefox release checks passed.`);
  await command("session.end");
} finally {
  socket?.close();
  child?.kill("SIGTERM");
  for (const handler of pending.values())
    handler.reject(Error("Firefox test ended"));
  if (child && child.exitCode === null)
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 2000).unref();
    });
  await rm(temporary, { recursive: true, force: true });
}
