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
  const g = advance(play(), 17.9);
  const runner = g.vehicles.find((v) => v.violator);
  assert.ok(runner);
  assert.ok(runner.x < 0);
  advance(g, 4);
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
test("the unannounced scooter produces a reproducible collision for a late unobservant crossing", () => {
  const g = advance(play(), 21.7);
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
test("retry resets time, traffic, player and outcome", () => {
  const g = advance(play(), 21.7);
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

test("enlarged character art does not change the 12 by 11 feet collision box", () => {
  const g = play();
  g.time = 18;
  g.player = { x: 640, y: 340 };
  assert.deepEqual(playerBounds(g.player), { x: 634, y: 335, w: 12, h: 11 });
  g.vehicles = [createVehicle("sedan", 0, { x: 640, y: 305, speed: 0 })];
  advance(g, 0.1);
  assert.equal(g.status, "playing");
  g.vehicles[0].y = 340;
  advance(g, 0.1);
  assert.equal(g.status, "failed");
});
test("violator gives at least four seconds of visible approach at a consistent speed", () => {
  const g = advance(play(), 18.5);
  const runner = g.vehicles.find((v) => v.violator);
  assert.ok(runner.x > 0 && runner.x < 40);
  const start = runner.x;
  advance(g, 1);
  assert.ok(Math.abs(runner.x - start - 135) < 0.01);
  assert.ok((640 - start) / runner.speed > 4);
  assert.equal(phaseAt(g.time).walk, true);
});

test("death headlines are exact and predictive hazard resources are removed", () => {
  assert.equal(messages.en.failedTitle, "YOU DIED");
  assert.equal(messages["zh-TW"].failedTitle, "歹勢，你鼠翹翹了");
  for (const dictionary of Object.values(messages)) {
    assert.equal(dictionary.hazardNote, undefined);
    assert.equal(dictionary.violation, undefined);
  }
});

test("ten traffic cycles remain bounded with an observable violation in every cycle", () => {
  const g = play();
  const observed = new Set();
  for (let frame = 0; frame < 300 * 60; frame++) {
    step(g, noInput, 1 / 60);
    assert.equal(g.status, "playing");
    assert.ok(g.vehicles.length < 20);
    assert.ok(g.spawned.size <= 11);
    for (const v of g.vehicles)
      if (v.violator && v.x > 600 && v.x < 650)
        observed.add(Math.floor(g.time / 30));
  }
  assert.equal(observed.size, 10);
});

test("lawful vehicles do not newly cross a red stop line over repeated cycles", () => {
  const g = play();
  for (let frame = 0; frame < 90 * 60; frame++) {
    const before = new Map(g.vehicles.map((v) => [v, { ...v }]));
    step(g, noInput, 1 / 60);
    for (const v of g.vehicles) {
      const old = before.get(v);
      if (!old || v.violator) continue;
      const l = LANES[v.lane],
        axis = l.axis === "h" ? "x" : "y",
        sign = v.dir === "east" || v.dir === "south" ? 1 : -1;
      const oldFront = old[axis] + (sign * old.length) / 2,
        front = v[axis] + (sign * v.length) / 2;
      if (
        sign * (l.stop - oldFront) >= -0.01 &&
        phaseAt(g.time).axis !== l.axis
      )
        assert.ok(sign * (front - l.stop) < 0.02);
    }
  }
});

test("substeps catch a vehicle collision during a stalled animation frame", () => {
  const g = play();
  g.time = 22;
  g.player = { x: 640, y: 300 };
  g.vehicles = [
    createVehicle("scooter", 0, { x: 590, y: 300, speed: 300, violator: true }),
  ];
  step(g, noInput, 0.25);
  assert.equal(g.status, "failed");
  assert.ok(g.time < 22.25);
});

test("lanes consistently use Taiwan's right-hand traffic", () => {
  assert.ok(
    LANES[0].y > LANES[1].y,
    "eastbound traffic stays south of westbound traffic",
  );
  assert.ok(
    LANES[2].x < LANES[3].x,
    "southbound traffic stays west of northbound traffic",
  );
});

test("the fixed lawful timetable avoids crossing vehicle bodies", () => {
  const g = play();
  for (let frame = 0; frame < 90 * 120; frame++) {
    step(g, noInput, 1 / 120);
    for (let i = 0; i < g.vehicles.length; i++)
      for (let j = i + 1; j < g.vehicles.length; j++) {
        const a = g.vehicles[i],
          b = g.vehicles[j];
        if (!a.violator && !b.violator)
          assert.ok(
            !overlaps(vehicleBounds(a), vehicleBounds(b)),
            `traffic overlap at ${g.time.toFixed(2)}: ${a.kind}/${a.dir} and ${b.kind}/${b.dir}`,
          );
      }
  }
});
