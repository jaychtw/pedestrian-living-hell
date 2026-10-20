import { messages, initialLanguage } from "./i18n.js";
import { createGame, step, phaseAt, noInput } from "./model.js";
import { createRenderer } from "./render.js";
let storage;
try {
  storage = window.localStorage;
} catch {}
let language = initialLanguage(storage),
  game = createGame();
const t = (key) => messages[language][key];
const canvas = document.querySelector("#game"),
  renderer = createRenderer(canvas, t),
  keys = new Set();
const $ = (selector) => document.querySelector(selector);
let last = 0,
  previousStatus = "",
  previousUi = "";
function localize() {
  document.documentElement.lang = language;
  document.title = `${t("brand")} · P0.1`;
  $('[id="language"]').textContent = language === "en" ? "繁體中文" : "English";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document
    .querySelectorAll("[data-i18n-aria]")
    .forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  $(".brand").setAttribute("aria-label", t("brand"));
  canvas.setAttribute("aria-label", t("canvasLabel"));
  previousStatus = "";
  previousUi = "";
  updateUI();
}
function begin() {
  game = createGame();
  game.status = "playing";
  keys.clear();
  previousStatus = "";
  updateUI();
  canvas.focus({ preventScroll: true });
}
function updateUI() {
  const phase = phaseAt(game.time),
    time = Math.ceil(phase.left);
  const ui = `${phase.walk}:${time}:${language}:${document.hidden}`;
  if (ui !== previousUi) {
    const label = t(document.hidden ? "paused" : phase.walk ? "walk" : "wait");
    if ($("#signal-label").textContent !== label)
      $("#signal-label").textContent = label;
    $("#signal-icon").style.color = phase.walk ? "#8df5a9" : "#ff9d74";
    $("#countdown").textContent = `${time}${t("timeUnit")}`;
    previousUi = ui;
  }
  if (previousStatus !== game.status) {
    $("#overlay").hidden = game.status === "playing";
    $("#overlay").className =
      game.status === "failed" ? "death" : game.status === "won" ? "won" : "";
    $("#hud").hidden = game.status !== "playing";
    $("#opening-controls").hidden = game.status !== "start";
    if (game.status !== "playing") {
      const prefix = game.status === "start" ? "start" : game.status;
      for (const [id, key] of [
        ["kicker", "Kicker"],
        ["title", "Title"],
        ["copy", "Copy"],
      ])
        $(`#overlay-${id}`).textContent = t(prefix + key);
      $("#action").textContent = t(prefix + "Action");
    }
    if (game.status === "failed" || game.status === "won") {
      keys.clear();
      $("#action").focus({ preventScroll: true });
    }
    previousStatus = game.status;
  }
}
$("#language").addEventListener("click", () => {
  language = language === "en" ? "zh-TW" : "en";
  try {
    storage?.setItem("plh-language", language);
  } catch {}
  localize();
});
$("#action").addEventListener("click", begin);
$("#restart").addEventListener("click", begin);
canvas.addEventListener("pointerdown", () =>
  canvas.focus({ preventScroll: true }),
);
window.addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLButtonElement ||
    e.target instanceof HTMLAnchorElement
  )
    return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
    e.preventDefault();
  if (["Enter", " "].includes(e.key) && game.status !== "playing") {
    begin();
    return;
  }
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  keys.clear();
  last = performance.now();
});
function input() {
  return {
    up: keys.has("w") || keys.has("arrowup"),
    down: keys.has("s") || keys.has("arrowdown"),
    left: keys.has("a") || keys.has("arrowleft"),
    right: keys.has("d") || keys.has("arrowright"),
  };
}
const params = new URLSearchParams(location.search);
let manual = params.has("test");
// Explicit browser-test mode; no extra controls or gameplay features in normal play.
if (manual) {
  window.p0Test = {
    get game() {
      return game;
    },
    advance(seconds, controls = noInput) {
      for (let i = 0; i < Math.ceil(seconds * 120); i++)
        step(game, controls, Math.min(1 / 120, seconds - i / 120));
      updateUI();
      renderer.draw(game, language);
    },
  };
}
function frame(now) {
  const dt = last ? (now - last) / 1000 : 0;
  last = now;
  if (!manual && !document.hidden) step(game, input(), dt);
  updateUI();
  renderer.draw(game, language);
  requestAnimationFrame(frame);
}
localize();
requestAnimationFrame(frame);
