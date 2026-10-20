import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  createVehicle,
  step,
  noInput,
  phaseAt,
  LANES,
  VEHICLES,
  vehicleBounds,
  BUILDINGS,
  playerBounds,
  overlaps,
} from "../src/model.js";
import { messages, initialLanguage } from "../src/i18n.js";
const play = () => ({ ...createGame(), status: "playing" });
function advance(g, seconds, input = noInput) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++)
    step(g, input, Math.min(1 / 120, seconds - i / 120));
  return g;
}
test("full signal cycle has protected pedestrian phase and clearance intervals", () => {
  assert.equal(phaseAt(0).axis, "h");
  assert.equal(phaseAt(8).axis, null);
  assert.equal(phaseAt(9).axis, "v");
  assert.equal(phaseAt(17).axis, null);
  assert.equal(phaseAt(18).walk, true);
  assert.equal(phaseAt(27).walk, false);
  assert.equal(phaseAt(30).axis, "h");
});
test("all four classes stop their leading edge at red in every direction", () => {
  for (const kind of Object.keys(VEHICLES))
    for (let lane = 0; lane < 4; lane++) {
      const g = play();
      g.time = 18;
      const l = LANES[lane],
        sign = lane === 0 || lane === 2 ? 1 : -1,
        coord = l.axis === "h" ? "x" : "y";
      const v = createVehicle(kind, lane);
      v[coord] = l.stop - sign * (v.length / 2 + 4);
      g.vehicles = [v];
      advance(g, 0.2);
      assert.equal(v[coord] + (sign * v.length) / 2, l.stop);
      assert.equal(g.status, "playing");
    }
});
test("a committed vehicle clears instead of freezing inside the junction", () => {
  const g = play();
  g.time = 18;
  const v = createVehicle("sedan", 0, { x: 430 });
  g.vehicles = [v];
  advance(g, 0.1);
  assert.ok(v.x > 430);
});
test("traffic is deterministic and exactly one observable violation occurs per cycle", () => {
  const a = advance(play(), 29),
    b = advance(play(), 29);
  assert.deepEqual(a.vehicles, b.vehicles);
  assert.equal(a.spawned.size, 11);
  assert.equal([...a.spawned].filter((k) => k.endsWith(":8")).length, 1);
  const g = advance(play(), 18.9);
  const runner = g.vehicles.find((v) => v.violator);
  assert.ok(runner);
  assert.ok(runner.x < 0);
  advance(g, 3);
  assert.ok(runner.x > LANES[0].stop);
  assert.equal(phaseAt(g.time).walk, true);
  assert.equal(g.status, "playing");
});
test("a cautious crossing is consistently beatable before the violating scooter arrives", () => {
  for (let n = 0; n < 3; n++) {
    const g = advance(play(), 18.05);
    advance(g, 3.3, { ...noInput, up: true });
    assert.equal(g.status, "won");
    assert.ok(g.violationSeen);
  }
});
test("the warned scooter produces a reproducible collision for a late unobservant crossing", () => {
  const g = advance(play(), 21);
  advance(g, 3.3, { ...noInput, up: true });
  assert.equal(g.status, "failed");
  assert.ok(
    g.vehicles.some(
      (v) => v.violator && overlaps(playerBounds(g.player), vehicleBounds(v)),
    ),
  );
  const time = g.time;
  advance(g, 1);
  assert.equal(g.time, time);
});
test("red pedestrian light does not restrict walking", () => {
  const g = play();
  advance(g, 1.2, { ...noInput, up: true });
  assert.ok(g.player.y < 430);
  assert.equal(phaseAt(g.time).walk, false);
});
test("solid buildings block movement, including diagonal movement", () => {
  const g = play();
  g.player = { x: 180, y: 235 };
  advance(g, 0.8, { ...noInput, up: true });
  assert.ok(g.player.y >= 213);
  assert.ok(!BUILDINGS.some((b) => overlaps(playerBounds(g.player), b)));
});
test("diagonal movement is normalized and world bounds hold", () => {
  const a = play(),
    b = play();
  advance(a, 0.5, { ...noInput, right: true });
  advance(b, 0.5, { ...noInput, right: true, down: true });
  assert.ok(
    Math.abs(
      Math.hypot(b.player.x - 640, b.player.y - 532) - (a.player.x - 640),
    ) < 0.001,
  );
  b.player = { x: 950, y: 626 };
  advance(b, 1, { ...noInput, right: true, down: true });
  assert.equal(b.player.x, 951);
  assert.equal(b.player.y, 627);
});
test("vehicles maintain following distance", () => {
  const g = play();
  const front = createVehicle("bus", 0, { x: 200 }),
    back = createVehicle("scooter", 0, { x: 120 });
  g.vehicles = [front, back];
  advance(g, 1);
  assert.ok(front.x - back.x >= (front.length + back.length) / 2 + 19 - 0.001);
});
test("English and Traditional Chinese resources have matching nonempty keys and exact completion text", () => {
  assert.deepEqual(
    Object.keys(messages.en).sort(),
    Object.keys(messages["zh-TW"]).sort(),
  );
  for (const dictionary of Object.values(messages))
    assert.ok(
      Object.values(dictionary).every(
        (x) => typeof x === "string" && x.length > 0,
      ),
    );
  assert.equal(messages.en.wonTitle, "Home safe.");
  assert.equal(messages["zh-TW"].wonTitle, "平安到家。");
  assert.equal(
    initialLanguage({
      getItem() {
        throw Error("blocked");
      },
    }),
    "en",
  );
});
test("retry resets time, hazards, player and outcome", () => {
  const g = advance(play(), 21);
  advance(g, 3.3, { ...noInput, up: true });
  const fresh = createGame();
  assert.equal(fresh.status, "start");
  assert.equal(fresh.time, 0);
  assert.equal(fresh.vehicles.length, 0);
  assert.equal(fresh.player.y, 532);
  assert.equal(fresh.collision, null);
});

test("waiting for the visible violator to pass also produces a safe crossing", () => {
  const g = advance(play(), 24);
  assert.ok(g.violationSeen);
  assert.ok(g.vehicles.find((v) => v.violator).x > 700);
  advance(g, 3.3, { up: true });
  assert.equal(g.status, "won");
});
