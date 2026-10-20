export const WORLD = { width: 960, height: 640 };
export const CYCLE = 30;
export const SPEED = 100;
export const BUILDINGS = [
  { x: 18, y: 51, w: 367, h: 157 },
  { x: 700, y: 49, w: 220, h: 177 },
  { x: 35, y: 493, w: 260, h: 120 },
  { x: 724, y: 493, w: 200, h: 120 },
];
export const HOME = { x: 612, y: 155, w: 66, h: 62 };
export const LANES = [
  { dir: "east", axis: "h", x: -85, y: 300, stop: 326 },
  { dir: "west", axis: "h", x: 1045, y: 389, stop: 671 },
  { dir: "south", axis: "v", x: 456, y: -85, stop: 179 },
  { dir: "north", axis: "v", x: 544, y: 725, stop: 517 },
];
export const VEHICLES = {
  scooter: { length: 26, width: 14, speed: 106 },
  sedan: { length: 44, width: 23, speed: 87 },
  bus: { length: 78, width: 28, speed: 65 },
  truck: { length: 61, width: 28, speed: 72 },
};
export function phaseAt(time) {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;
  if (t < 7)
    return {
      id: "horizontal",
      axis: "h",
      walk: false,
      left: 7 - t,
      duration: 7,
    };
  if (t < 9)
    return { id: "clear", axis: null, walk: false, left: 9 - t, duration: 2 };
  if (t < 16)
    return {
      id: "vertical",
      axis: "v",
      walk: false,
      left: 16 - t,
      duration: 7,
    };
  if (t < 18)
    return { id: "clear", axis: null, walk: false, left: 18 - t, duration: 2 };
  if (t < 27)
    return {
      id: "pedestrian",
      axis: null,
      walk: true,
      left: 27 - t,
      duration: 9,
    };
  return { id: "clear", axis: null, walk: false, left: 30 - t, duration: 3 };
}
export function createVehicle(kind, lane, extra = {}) {
  const l = LANES[lane];
  return {
    kind,
    lane,
    dir: l.dir,
    x: l.x,
    y: l.y,
    ...VEHICLES[kind],
    ...(l.axis === "v"
      ? {
          length: { scooter: 26, sedan: 32, bus: 46, truck: 40 }[kind],
          width: { scooter: 14, sedan: 26, bus: 32, truck: 30 }[kind],
        }
      : {}),
    violator: false,
    ...extra,
  };
}
export function vehicleBounds(v) {
  const horizontal = LANES[v.lane].axis === "h";
  const w = horizontal ? v.length : v.width,
    h = horizontal ? v.width : v.length;
  return { x: v.x - w / 2, y: v.y - h / 2, w, h };
}
export function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
export function playerBounds(p) {
  return { x: p.x - 6, y: p.y - 5, w: 12, h: 11 };
}
export function createGame() {
  return {
    status: "start",
    time: 0,
    player: { x: 640, y: 532, facing: "north", walking: false },
    vehicles: [],
    spawned: new Set(),
    violationSeen: false,
    collision: null,
  };
}
// A fixed timetable makes signal discipline, safe crossings and the violation reproducible.
const SCHEDULE = [
  { at: 0.2, kind: "sedan", lane: 0 },
  { at: 0.5, kind: "scooter", lane: 1 },
  { at: 1.2, kind: "bus", lane: 0 },
  { at: 2.7, kind: "truck", lane: 1 },
  { at: 5, kind: "sedan", lane: 2 },
  { at: 5.6, kind: "bus", lane: 3 },
  { at: 8, kind: "scooter", lane: 2 },
  { at: 10, kind: "truck", lane: 3 },
  { at: 18.8, kind: "scooter", lane: 0, violator: true, speed: 165 },
  { at: 23, kind: "truck", lane: 0 },
  { at: 24, kind: "sedan", lane: 1 },
];
function moveVehicles(g, dt) {
  const phase = phaseAt(g.time);
  for (const v of g.vehicles) {
    const lane = LANES[v.lane],
      positive = v.dir === "east" || v.dir === "south",
      coord = lane.axis === "h" ? "x" : "y",
      sign = positive ? 1 : -1;
    let distance = v.speed * dt;
    // Stop the leading edge before the stop line. Vehicles already committed clear the junction.
    const front = v[coord] + (sign * v.length) / 2;
    const before = positive
      ? front <= lane.stop + 0.01
      : front >= lane.stop - 0.01;
    if (!v.violator && phase.axis !== lane.axis && before)
      distance = Math.min(distance, Math.max(0, sign * (lane.stop - front)));
    for (const other of g.vehicles) {
      if (other === v || other.lane !== v.lane) continue;
      const gap =
        sign * (other[coord] - v[coord]) - (other.length + v.length) / 2 - 19;
      if (sign * (other[coord] - v[coord]) > 0)
        distance = Math.min(distance, Math.max(0, gap));
    }
    v[coord] += sign * distance;
  }
  g.vehicles = g.vehicles.filter(
    (v) => v.x > -140 && v.x < 1100 && v.y > -140 && v.y < 780,
  );
}
export function movePlayer(g, input, dt) {
  let x = Number(!!input.right) - Number(!!input.left),
    y = Number(!!input.down) - Number(!!input.up);
  const n = Math.hypot(x, y);
  g.player.walking = n > 0;
  if (!n) return;
  x = (x / n) * SPEED * dt;
  y = (y / n) * SPEED * dt;
  g.player.facing =
    Math.abs(x) > Math.abs(y)
      ? x > 0
        ? "east"
        : "west"
      : y > 0
        ? "south"
        : "north";
  for (const [axis, delta] of [
    ["x", x],
    ["y", y],
  ]) {
    const next = { ...g.player, [axis]: g.player[axis] + delta };
    next.x = Math.max(9, Math.min(951, next.x));
    next.y = Math.max(27, Math.min(627, next.y));
    if (!BUILDINGS.some((b) => overlaps(playerBounds(next), b)))
      g.player[axis] = next[axis];
  }
}
export function step(g, input, elapsed) {
  if (g.status !== "playing") return;
  let remaining = Math.min(Math.max(elapsed, 0), 0.25);
  while (remaining > 1e-8 && g.status === "playing") {
    const dt = Math.min(remaining, 1 / 120);
    remaining -= dt;
    const previous = g.time;
    g.time += dt;
    const cycle = Math.floor(g.time / CYCLE);
    for (let c = Math.floor(previous / CYCLE); c <= cycle; c++)
      for (let i = 0; i < SCHEDULE.length; i++) {
        const entry = SCHEDULE[i],
          at = c * CYCLE + entry.at,
          key = `${c}:${i}`;
        if (at > previous && at <= g.time && !g.spawned.has(key)) {
          g.spawned.add(key);
          g.vehicles.push(
            createVehicle(
              entry.kind,
              entry.lane,
              entry.violator ? { violator: true, speed: entry.speed } : {},
            ),
          );
          if (entry.violator) g.violationSeen = true;
        }
      }
    movePlayer(g, input, dt);
    moveVehicles(g, dt);
    for (const v of g.vehicles) {
      const b = vehicleBounds(v);
      const inset = { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 };
      if (overlaps(playerBounds(g.player), inset)) {
        g.status = "failed";
        g.collision = { x: g.player.x, y: g.player.y };
        break;
      }
    }
    if (g.status === "playing" && overlaps(playerBounds(g.player), HOME))
      g.status = "won";
  }
}
export const noInput = { up: false, down: false, left: false, right: false };
