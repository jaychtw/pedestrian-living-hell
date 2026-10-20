import { BUILDINGS, LANES, phaseAt, createVehicle } from "./model.js";
const P = {
  asphalt: "#555873",
  edge: "#c0bdaa",
  walk: "#c8c6ad",
  tile: "#b4b79f",
  ink: "#252c49",
  cream: "#fff0cf",
  gold: "#dfb468",
  green: "#719078",
};
export function createRenderer(canvas, t) {
  const screen = canvas.getContext("2d");
  const world = document.createElement("canvas");
  world.width = 960;
  world.height = 640;
  const ctx = world.getContext("2d");
  screen.imageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  let bg = null;
  let cacheLanguage = "";
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function text(s, x, y, size = 12, c = P.cream, align = "left") {
    ctx.font = `600 ${size}px "Noto Sans TC", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = c;
    ctx.fillText(s, Math.round(x), Math.round(y));
    ctx.textAlign = "left";
  }
  function present() {
    // A decorative skyline sits outside the world; physics coordinates do not change.
    screen.fillStyle = "#43c9ef";
    screen.fillRect(0, 0, 960, 76);
    const box = (x, y, w, h, c) => {
      screen.fillStyle = c;
      screen.fillRect(x, y, w, h);
    };
    box(0, 0, 960, 19, "#32b9ed");
    box(0, 55, 960, 21, "#83def2");
    for (const [x, y, w] of [
      [33, 13, 86],
      [247, 25, 61],
      [574, 9, 91],
      [824, 20, 74],
    ]) {
      box(x, y, w, 12, "#d4f7ff");
      box(x + 14, y - 8, w - 32, 11, "#fff9e9");
      box(x - 9, y + 7, w + 22, 6, "#effaff");
      box(x + 15, y + 13, w - 15, 3, "#a2e6f6");
    }
    for (let i = 0; i < 17; i++) {
      const x = i * 61,
        top = 47 + ((i * 13) % 20);
      box(x, top, 44, 76 - top, i % 2 ? "#6fbcd2" : "#91c9d3");
      box(x + 6, top - 4, 31, 4, "#b2e1e2");
      for (let wx = x + 7; wx < x + 39; wx += 12)
        box(wx, top + 7, 5, 8, "#aedee4");
    }
    screen.drawImage(world, 0, 76);
  }
  function planter(x, y) {
    rect(x - 18, y + 7, 37, 21, "#343950");
    rect(x - 15, y + 8, 31, 16, "#cd7853");
    rect(x - 18, y + 7, 37, 5, "#f4ae6f");
    rect(x - 13, y + 20, 26, 3, "#a34f48");
    rect(x - 3, y - 9, 6, 20, "#735045");
    rect(x - 18, y - 18, 32, 28, "#1e624e");
    rect(x - 14, y - 29, 28, 29, "#228a56");
    rect(x - 23, y - 14, 43, 20, "#249e57");
    rect(x - 16, y - 24, 29, 17, "#4ac55e");
    rect(x - 9, y - 32, 19, 12, "#88d94c");
    rect(x - 20, y - 10, 15, 10, "#6cd45c");
    rect(x + 5, y - 15, 12, 10, "#63cd53");
    rect(x - 13, y - 23, 7, 5, "#b3e568");
    rect(x + 5, y - 6, 7, 6, "#177c50");
    rect(x - 11, y + 10, 3, 9, "#f8bf83");
  }
  function window(x, y, w = 28, h = 30) {
    rect(x - 2, y - 2, w + 4, h + 4, "#39435d");
    rect(x, y, w, h, "#3b8da7");
    rect(x + 3, y + 3, w - 6, h - 6, "#76d2db");
    rect(x + 3, y + 3, w - 6, 5, "#b6edf0");
    rect(x + 3, y + h - 10, w - 6, 6, "#3a9caf");
    rect(x + w / 2 - 1, y + 2, 3, h - 4, "#f3e8c3");
    rect(x + 2, y + h / 2, w - 4, 3, "#f3e8c3");
    rect(x - 4, y + h, w + 8, 4, "#e7d8b6");
    rect(x - 3, y + h + 4, w + 6, 2, "#8c6980");
  }
  function ac(x, y) {
    rect(x - 1, y - 1, 28, 19, "#53526b");
    rect(x, y, 26, 17, "#e4ddd4");
    rect(x + 3, y + 3, 12, 11, "#8da5b5");
    rect(x + 6, y + 4, 6, 9, "#617b91");
    rect(x + 4, y + 7, 10, 2, "#d1e0df");
    for (let i = 0; i < 4; i++) rect(x + 18, y + 3 + i * 3, 6, 1, "#657b90");
  }
  function facade(x, y, w, h, kind) {
    const wall = ["#f1c38c", "#f3a18b", "#8ed6cb"][kind],
      shade = ["#c58674", "#cc746c", "#55a6ad"][kind];
    const sign = ["#167f83", "#c7494e", "#8058a0"][kind];
    rect(x + 7, y + 8, w, h, "#2b314a40");
    rect(x - 2, y, w + 4, h, "#343a56");
    rect(x + 2, y + 8, w - 4, h - 10, shade);
    rect(x + 5, y + 10, w - 11, h - 20, wall);
    rect(x - 4, y - 4, w + 8, 10, "#455674");
    rect(x - 1, y - 2, w + 2, 4, "#7da2b3");
    rect(x + 2, y + 8, w - 4, 4, "#ffe4ba");
    for (let wx = x + 14; wx < x + w - 20; wx += 44) {
      window(wx, y + 20, 26, 27);
      // Flower boxes and small balconies break up the repeated upper-storey grid.
      if ((wx - x) % 3) {
        rect(wx - 3, y + 52, 33, 6, "#d18c6e");
        rect(wx, y + 48, 26, 6, "#348955");
        rect(wx + 3, y + 47, 4, 4, "#ffdb59");
        rect(wx + 16, y + 48, 4, 4, "#ef6b8b");
      }
    }
    ac(x + w - 35, y + 57);
    rect(x + 3, y + 71, w - 6, 3, shade);
    rect(x + 4, y + 76, w - 8, 30, "#303a52");
    rect(x + 7, y + 78, w - 14, 25, sign);
    rect(x + 10, y + 80, w - 20, 2, "#ffd5a2");
    text(
      t(["shopTea", "shopFood", "shopMarket"][kind]),
      x + w / 2,
      y + 92,
      18,
      "#fff2c7",
      "center",
    );
    rect(x + 9, y + 109, w - 18, h - 113, "#253d58");
    for (let wx = x + 15; wx < x + w - 15; wx += 24) {
      rect(wx, y + 116, 17, h - 126, "#4fa7b1");
      rect(wx + 2, y + 118, 4, h - 132, "#a5e1d8");
      rect(wx, y + h - 20, 17, 3, "#e7c887");
    }
    rect(x + 8, y + h - 9, w - 16, 7, "#6b6575");
    rect(x + 10, y + h - 9, w - 20, 2, "#e4bf91");
    rect(x + 1, y + 106, w - 2, 4, "#343b54");
    for (let a = 0; a < Math.ceil((w - 4) / 12); a++) {
      const aw = Math.min(12, w - 4 - a * 12);
      rect(x + 2 + a * 12, y + 108, aw, 10, a % 2 ? "#fff0bc" : sign);
      rect(x + 2 + a * 12, y + 118, aw, 3, a % 2 ? "#d9c59e" : shade);
    }
    // Open shopfront counter: cups, bowls, produce, all inside the solid facade.
    rect(x + 17, y + h - 27, w - 34, 10, "#b37456");
    rect(x + 17, y + h - 28, w - 34, 3, "#efc58a");
    for (let i = 0; i < 3; i++) {
      const bx = x + 23 + (i * (w - 49)) / 3;
      if (kind === 0) {
        rect(bx, y + h - 39, 7, 11, "#fff0c2");
        rect(bx + 1, y + h - 41, 7, 3, "#f4a83d");
        rect(bx + 4, y + h - 46, 2, 7, "#f8dfad");
      } else if (kind === 1) {
        rect(bx, y + h - 36, 14, 5, "#f8e1b1");
        rect(bx + 3, y + h - 31, 8, 3, "#d4b488");
        rect(bx + 3, y + h - 40, 8, 3, "#e9be67");
      } else {
        rect(bx, y + h - 37, 9, 8, i % 2 ? "#fca64c" : "#9bce4a");
        rect(bx + 3, y + h - 40, 3, 4, "#348657");
      }
    }
  }
  function shortBlock(b, kind) {
    rect(b.x + 7, b.y + 9, b.w, b.h, "#30385540");
    rect(b.x - 2, b.y + 12, b.w + 4, b.h - 10, "#374058");
    rect(b.x, b.y + 18, b.w, b.h - 18, kind ? "#9cd8d6" : "#f3bd85");
    rect(b.x - 3, b.y + 9, b.w + 6, 12, kind ? "#338e9d" : "#bc6a62");
    rect(b.x + 1, b.y, b.w - 2, 13, kind ? "#c8ece0" : "#ffe0a1");
    rect(b.x + 10, b.y + 4, b.w - 20, 4, kind ? "#8bc7c8" : "#e4a66e");
    for (let x = b.x + 17; x < b.x + b.w - 20; x += 46)
      window(x, b.y + 34, 28, 28);
    rect(b.x + 10, b.y + 78, b.w - 20, 29, "#333d5a");
    rect(b.x + 13, b.y + 80, b.w - 26, 24, kind ? "#168e89" : "#d67335");
    text(
      t(kind ? "shopClinic" : "shopRepair"),
      b.x + b.w / 2,
      b.y + 92,
      18,
      P.cream,
      "center",
    );
    if (kind) {
      rect(b.x + 22, b.y + 85, 5, 14, "#fdf7dc");
      rect(b.x + 18, b.y + 89, 13, 5, "#fdf7dc");
    }
    for (let x = b.x + 20; x < b.x + b.w - 25; x += 19)
      rect(x, b.y + 108, 14, 10, "#365e76");
    ac(b.x + b.w - 49, b.y + 31);
  }
  function road() {
    rect(0, 0, 960, 640, "#ead4ac");
    rect(0, 234, 960, 221, "#d8b897");
    rect(400, 0, 200, 640, "#d8b897");
    rect(0, 248, 960, 193, P.asphalt);
    rect(407, 0, 186, 640, P.asphalt);
    // Fixed little flecks make the tarmac read as pixel art rather than a flat fill.
    for (let i = 0; i < 1400; i++) {
      const x = (i * 149 + 31) % 960,
        y = (i * 67 + 17) % 640;
      if ((y > 249 && y < 440) || (x > 408 && x < 592))
        rect(x, y, 2, 1, i % 2 ? "#60637e" : "#4d526d");
    }
    rect(0, 245, 402, 3, "#ffdf9f");
    rect(599, 245, 361, 3, "#ffdf9f");
    rect(0, 441, 402, 3, "#ffdf9f");
    rect(599, 441, 361, 3, "#ffdf9f");
    rect(404, 0, 3, 242, "#ffdf9f");
    rect(594, 0, 3, 242, "#ffdf9f");
    rect(404, 447, 3, 193, "#ffdf9f");
    rect(594, 447, 3, 193, "#ffdf9f");
    for (let y = 236; y < 640; y += 18)
      for (let x = 8; x < 960; x += 24) {
        if ((y < 245 || y > 455) && (x < 395 || x > 603))
          rect(x, y, 20, 1, "#bd9c8138");
      }
    for (const [x, y] of [
      [312, 244],
      [680, 244],
      [313, 443],
      [679, 443],
    ]) {
      rect(x, y, 20, 3, "#dd5a55");
      rect(x + 6, y, 4, 3, "#ffb780");
    }
    // Double yellow center lines and directional lane dashes.
    for (const y of [341, 347]) {
      rect(0, y, 325, 2, "#f8c84d");
      rect(675, y, 285, 2, "#f8c84d");
    }
    for (const x of [497, 503]) {
      rect(x, 0, 2, 174, "#f8c84d");
      rect(x, 522, 2, 118, "#f8c84d");
    }
    // Four zebra crossings.
    for (let y = 265; y < 427; y += 20) {
      rect(350, y, 38, 11, "#ffefd3");
      rect(614, y, 38, 11, "#ffefd3");
    }
    for (let x = 414; x < 591; x += 21) {
      rect(x, 202, 12, 37, "#ffefd3");
      rect(x, 458, 12, 37, "#ffefd3");
    }
    rect(326, 254, 5, 72, "#fff2ce");
    rect(669, 363, 5, 73, "#fff2ce");
    rect(413, 177, 72, 5, "#fff2ce");
    rect(519, 516, 69, 5, "#fff2ce");
    // Lane arrows, authored at pixel scale.
    for (const [x, y, dir] of [
      [195, 300, 1],
      [774, 389, -1],
    ]) {
      rect(x - 14, y - 2, 28, 4, "#d3d6d5");
      for (let i = 0; i < 4; i++)
        rect(x + dir * (i * 4), y - 8 + i * 2, 4, 16 - i * 4, "#d3d6d5");
    }
    for (const [x, y, dir] of [
      [456, 120, 1],
      [544, 568, -1],
    ]) {
      rect(x - 2, y - 14, 4, 28, "#d3d6d5");
      for (let i = 0; i < 4; i++)
        rect(x - 8 + i * 2, y + dir * (i * 4), 16 - i * 4, 4, "#d3d6d5");
    }
    for (let x = 12; x < 960; x += 27)
      for (const y of [237, 449])
        if (x < 397 || x > 602) rect(x, y, 19, 2, "#cf967c");
    for (const [x, y] of [
      [305, 228],
      [679, 228],
      [303, 453],
      [684, 453],
    ]) {
      rect(x, y, 21, 9, "#465673");
      for (let i = 0; i < 5; i++) rect(x + 3 + i * 4, y + 1, 1, 7, "#94a6b6");
    }
  }
  function scenery() {
    road();
    // Low front-facing row along the upper edge, with water tanks and roof detail.
    rect(8, 26, 384, 24, "#476482");
    rect(18, 16, 365, 17, "#82b4c8");
    for (let x = 26; x < 380; x += 27) rect(x, 18, 19, 11, "#b6e0df");
    rect(48, 0, 36, 19, "#b2d3d8");
    rect(44, 5, 44, 4, "#f1f3d5");
    rect(50, 18, 32, 4, "#538ba6");
    facade(18, 51, 122, 157, 0);
    facade(143, 51, 139, 157, 1);
    facade(285, 51, 100, 157, 2);
    rect(687, 32, 255, 16, "#377f9c");
    rect(697, 18, 235, 16, "#81c8ce");
    rect(874, 3, 34, 23, "#b4dada");
    rect(870, 9, 42, 4, "#f7f0cf");
    facade(700, 49, 220, 171, 0);
    rect(709, 123, 202, 27, "#327ea0");
    text(t("shopHome"), 810, 137, 19, P.cream, "center");
    rect(771, 164, 33, 52, "#2c4a6c");
    rect(775, 167, 25, 45, "#54b3bf");
    rect(795, 188, 3, 4, "#ffe7a6");
    rect(709, 220, 200, 6, "#639fb1");
    // Vertical shop blades and small stools, pots and lanterns.
    rect(22, 87, 24, 82, "#d6464f");
    for (let i = 0; i < 2; i++)
      text(
        [...t("shopTea")][i] || "",
        34,
        108 + i * 27,
        20,
        "#fff1ca",
        "center",
      );
    rect(288, 86, 22, 79, "#ffd568");
    for (let i = 0; i < 3; i++)
      text(
        [...t("shopMarket")][i] || "",
        299,
        101 + i * 22,
        16,
        "#554675",
        "center",
      );
    for (let x = 164; x < 275; x += 36) {
      rect(x, 208, 13, 8, "#e66b42");
      rect(x + 1, 216, 3, 8, "#944256");
      rect(x + 9, 216, 3, 8, "#944256");
    }
    for (const [x, y] of [
      [93, 221],
      [329, 213],
      [876, 231],
      [707, 235],
      [31, 474],
      [309, 540],
      [900, 476],
      [704, 587],
    ])
      planter(x, y);
    shortBlock(BUILDINGS[2], false);
    shortBlock(BUILDINGS[3], true);
    // A tiny parked scooter row and roadside utility box.
    for (let i = 0; i < 3; i++) {
      rect(70 + i * 37, 465, 24, 11, "#324865");
      rect(75 + i * 37, 461, 12, 8, i % 2 ? "#54c6d3" : "#e57870");
      rect(72 + i * 37, 474, 6, 4, P.ink);
      rect(87 + i * 37, 474, 6, 4, P.ink);
    }
    rect(363, 538, 23, 43, "#7195ba");
    rect(366, 541, 17, 25, "#bfd6df");
    rect(368, 545, 13, 2, "#4c759b");
    rect(372, 571, 6, 2, "#fff0b4");
    rect(940, 493, 6, 100, "#3f668c");
    rect(935, 490, 16, 7, "#f5d698");
    rect(937, 486, 12, 5, "#ffdf71");
    // Red lanterns, a shop menu and utility wires give each frontage its own rhythm.
    for (const x of [166, 262]) {
      rect(x, 161, 2, 11, "#353e58");
      rect(x - 6, 172, 14, 16, "#a9344e");
      rect(x - 4, 173, 10, 12, "#ed6a4d");
      rect(x - 1, 174, 3, 10, "#ffc06b");
      rect(x, 188, 2, 7, "#e56b52");
    }
    rect(114, 175, 19, 26, "#353b52");
    rect(117, 178, 13, 20, "#e9cb83");
    for (let i = 0; i < 4; i++) rect(119, 182 + i * 4, 9, 1, "#aa6b49");
    for (let i = 0; i < 3; i++) {
      rect(318 + i * 18, 199, 16, 10, "#9b6c4f");
      rect(320 + i * 18, 196, 5, 6, i % 2 ? "#f67e45" : "#9dd34d");
      rect(326 + i * 18, 195, 5, 7, "#ffd052");
    }
    // A balcony clothesline and water-tank bands live above the action.
    rect(716, 65, 64, 1, "#4d6180");
    rect(726, 65, 9, 12, "#e98c9a");
    rect(743, 65, 10, 14, "#ffe193");
    rect(762, 65, 9, 11, "#75c7da");
    for (const [x, y] of [
      [48, 4],
      [874, 6],
    ]) {
      rect(x, y, 34, 2, "#f7edda");
      rect(x, y + 8, 34, 2, "#6896b5");
    }
    // Road-name plates are environmental signage, translated centrally.
    rect(17, 449, 83, 18, "#198d91");
    text(t("roadA"), 58, 459, 11, P.cream, "center");
    rect(601, 26, 20, 75, "#198d91");
    for (let i = 0; i < 3; i++)
      text([...t("roadB")][i], 611, 40 + i * 20, 13, P.cream, "center");
  }
  function signal(x, y, axis, phase, ped = false) {
    rect(x - 2, y + 9, 4, 27, "#475f50");
    rect(x - 7, y - 13, 15, 27, "#293e36");
    const active = ped ? phase.walk : phase.axis === axis;
    rect(x - 4, y - 10, 9, 8, active ? "#594d3b" : "#e18a64");
    rect(x - 4, y + 1, 9, 9, active ? "#b8d490" : "#415c48");
    if (ped && active) {
      rect(x - 1, y + 2, 3, 3, "#eaf2bf");
      rect(x - 2, y + 6, 5, 2, "#eaf2bf");
    }
  }
  function marker(x, y, label, color, time, home = false) {
    const bob = Math.round(Math.sin(time * 2) * 2);
    if (home) {
      rect(x - 23, y + 19, 46, 12, "#314e3520");
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 24, y + 9, 48, 29);
      ctx.setLineDash([]);
    }
    rect(x - 28, y - 32 + bob, 56, 24, color);
    text(label, x, y - 20 + bob, 12, "#f4efd8", "center");
    rect(x - 3, y - 8 + bob, 6, 4, color);
    rect(x - 1, y - 4 + bob, 2, 3, color);
    if (home) {
      rect(x - 6, y + 17, 12, 12, "#e7d5a3");
      rect(x - 3, y + 22, 5, 7, "#597b5e");
      rect(x - 9, y + 15, 18, 3, color);
      rect(x - 6, y + 12, 12, 3, color);
    }
  }
  function vehicle(v, time) {
    const x = Math.round(v.x),
      y = Math.round(v.y),
      h = LANES[v.lane].axis === "h",
      positive = v.dir === "east" || v.dir === "south";
    const palette = {
      scooter: ["#d65d43", "#ffa552"],
      sedan: ["#358cbb", "#81dded"],
      bus: ["#e19a37", "#ffe38e"],
      truck: ["#7563a7", "#c0b2dc"],
    }[v.kind];
    const [dark, light] = palette;
    const length = v.length,
      width = v.width;
    rect(
      x - (h ? length : width) / 2 + 3,
      y - (h ? width : length) / 2 + 4,
      h ? length : width,
      h ? width : length,
      "#263f3540",
    );
    rect(
      x - (h ? length : width) / 2 - 1,
      y - (h ? width : length) / 2 - 1,
      h ? length + 2 : width + 2,
      h ? width + 1 : length + 2,
      P.ink,
    );
    if (v.kind === "scooter") {
      if (h) {
        rect(x - 11, y + 4, 7, 5, P.ink);
        rect(x + 6, y + 4, 7, 5, P.ink);
        rect(x - 11, y - 3, 22, 8, dark);
        rect(x + (positive ? 7 : -12), y - 9, 6, 11, light);
        rect(x - 5, y - 10, 10, 9, "#394e45");
        rect(x - 4, y - 16, 9, 8, "#e6d8b0");
        rect(x - 3, y - 13, 8, 3, "#708578");
        rect(x + (positive ? 12 : -14), y - 4, 3, 4, "#f3e5b7");
        rect(x + (positive ? 8 : -10), y - 12, 3, 5, P.ink);
      } else {
        rect(x - 3, y - 14, 6, 28, P.ink);
        rect(x - 6, y - 10, 12, 20, dark);
        rect(x - 8, y + (positive ? 4 : -6), 16, 3, P.ink);
        rect(x - 4, y - 7, 9, 13, "#3d574b");
        rect(x - 5, y - 11, 10, 8, "#e3d6aa");
        rect(x - 3, y - 9, 7, 3, positive ? "#6d8275" : "#b8b49a");
        rect(
          x - 3,
          y + (positive ? 9 : -13),
          6,
          3,
          positive ? "#eee0ab" : "#b66a51",
        );
      }
    } else if (h) {
      rect(x - length / 2 + 7, y + width / 2 - 3, 10, 6, P.ink);
      rect(x + length / 2 - 17, y + width / 2 - 3, 10, 6, P.ink);
      rect(x - length / 2, y - width / 2, length, width - 3, dark);
      rect(x - length / 2 + 3, y - width / 2 + 2, length - 6, 4, light);
      if (v.kind === "bus") {
        rect(x - length / 2 + 4, y - width / 2 + 8, length - 8, 9, "#405d52");
        for (let i = 0; i < 5; i++)
          rect(x - length / 2 + 5 + i * 13, y - width / 2 + 9, 9, 6, "#8fae99");
        rect(x - length / 2 + 2, y + 6, length - 4, 3, "#476e5a");
        rect(
          x + (positive ? length / 2 - 13 : -length / 2 + 4),
          y - 3,
          9,
          13,
          "#5c7f69",
        );
        text(t("busSign"), x, y + 3, 7, "#f1e4b6", "center");
      } else if (v.kind === "truck") {
        const cargoX = positive ? x - length / 2 : x - length / 2 + 19;
        rect(cargoX, y - width / 2 - 5, length - 21, width - 1, "#c0c6b0");
        rect(cargoX + 3, y - width / 2 - 3, length - 27, 3, "#e0d9bb");
        for (let i = 0; i < 4; i++)
          rect(cargoX + 4 + i * 8, y - width / 2, 1, width - 7, "#97aa98");
        rect(
          x + (positive ? length / 2 - 15 : -length / 2 + 3),
          y - width / 2 + 3,
          12,
          9,
          "#45695c",
        );
      } else {
        rect(x - 14, y - width / 2 - 6, 28, 12, light);
        rect(x - 11, y - width / 2 - 4, 22, 7, "#486d5d");
        rect(x - 1, y - width / 2 - 5, 3, 9, dark);
        rect(x - 17, y + 3, 34, 3, light);
        rect(x - 6, y + 1, 5, 1, "#566e60");
      }
      rect(
        x + (positive ? length / 2 - 3 : -length / 2),
        y - 4,
        3,
        5,
        "#eee1b0",
      );
      rect(x + (positive ? -length / 2 : length / 2 - 3), y, 3, 4, "#b36c51");
    } else {
      // Authored front/rear elevations, not rotated side sprites or roof views.
      const left = x - width / 2,
        top = y - length / 2,
        bottom = y + length / 2;
      rect(left + 1, bottom - 5, 5, 7, P.ink);
      rect(left + width - 6, bottom - 5, 5, 7, P.ink);
      rect(left, top + 3, width, length - 6, dark);
      rect(left + 3, top, width - 6, 5, light);
      rect(left + 2, top + 5, width - 4, length - 11, light);
      if (v.kind === "truck" && !positive) {
        rect(left + 2, top + 3, width - 4, length - 9, "#c7c9b1");
        rect(x - 1, top + 4, 2, length - 12, "#819c8d");
        for (let i = 0; i < 5; i++)
          rect(left + 4, top + 6 + i * 5, width - 8, 1, "#9dab95");
        rect(x - 4, y, 2, 9, "#627d6b");
        rect(x + 3, y, 2, 9, "#627d6b");
      } else {
        const glassHeight = v.kind === "bus" ? 15 : v.kind === "truck" ? 12 : 9;
        rect(
          left + 3,
          top + 7,
          width - 6,
          glassHeight,
          positive ? "#385f53" : "#608471",
        );
        rect(left + 5, top + 9, width - 10, 3, "#93b29b");
        if (v.kind === "bus") {
          rect(
            left + 4,
            top + 2,
            width - 8,
            4,
            positive ? "#36564a" : "#b47859",
          );
          if (positive) {
            rect(x - 1, top + 7, 2, glassHeight, light);
            rect(left + 5, top + glassHeight + 5, 8, 1, "#b6c3a7");
          } else
            for (let i = 0; i < 4; i++)
              rect(left + 6, y + 3 + i * 3, width - 12, 1, "#698974");
          rect(left + 2, bottom - 13, width - 4, 4, "#4e7c63");
        } else if (v.kind === "truck") {
          rect(left - 2, top + 9, 3, 6, dark);
          rect(left + width - 1, top + 9, 3, 6, dark);
          rect(left + 6, bottom - 15, width - 12, 6, "#4c7063");
          for (let i = 0; i < 3; i++)
            rect(left + 7, bottom - 14 + i * 2, width - 14, 1, "#adc0a6");
        } else {
          rect(left + 4, top + 19, width - 8, 2, dark);
          rect(x - 5, bottom - 10, 10, 3, positive ? "#516e5c" : dark);
        }
      }
      rect(left + 2, bottom - 8, 5, 3, positive ? "#f0e2aa" : "#b9654d");
      rect(
        left + width - 7,
        bottom - 8,
        5,
        3,
        positive ? "#f0e2aa" : "#b9654d",
      );
      rect(left + 1, bottom - 4, width - 2, 3, "#607b69");
      rect(x - 4, bottom - 4, 8, 2, "#e1d9bd");
    }
  }
  function player(p, time) {
    const x = Math.round(p.x),
      y = Math.round(p.y),
      stride = p.walking ? (Math.sin(time * 18) > 0 ? 2 : -2) : 0;
    // Art is 34 × 52; the unchanged 12 × 11 feet box remains in model.js.
    rect(x - 13, y + 5, 27, 7, "#202c4755");
    rect(x - 10, y + 7, 21, 3, "#1b294a44");
    // A pale silhouette keeps the pedestrian readable against traffic and decoration.
    rect(x - 13, y - 39, 27, 11, "#fff1d5");
    rect(x - 17, y - 23, 35, 18, "#fff1d5");
    rect(x - 10, y - 8, 22, 15, "#fff1d5");
    rect(x - 9, y - 12, 8, 14 + stride, "#262e55");
    rect(x + 3, y - 12, 8, 14 - stride, "#262e55");
    rect(x - 9, y + 2 + stride, 9, 4, "#f6f2df");
    rect(x + 3, y + 2 - stride, 9, 4, "#f6f2df");
    rect(x - 10, y - 25, 23, 17, "#782f65");
    rect(x - 8, y - 24, 19, 15, "#f05a88");
    rect(x - 7, y - 22, 5, 10, "#ff91a7");
    rect(x - 15, y - 22, 5, 13, "#bd376a");
    rect(x + 13, y - 22, 4, 13, "#bd376a");
    rect(x - 15, y - 10, 5, 5, "#f3ba88");
    rect(x + 13, y - 10, 4, 5, "#f3ba88");
    if (p.facing === "north") {
      rect(x - 6, y - 24, 15, 17, "#273c75");
      rect(x - 4, y - 22, 11, 12, "#4267a2");
      rect(x - 3, y - 13, 9, 5, "#6c92c2");
      rect(x - 3, y - 24, 8, 2, "#b0cbdd");
    } else {
      rect(x - 4, y - 23, 3, 14, "#fff2c9");
      rect(x + 6, y - 23, 2, 14, "#fff2c9");
      rect(x + 1, y - 18, 3, 3, "#f6be68");
    }
    rect(x - 9, y - 39, 21, 15, "#382e45");
    rect(x - 7, y - 37, 17, 12, "#f4bf90");
    rect(x - 4, y - 27, 10, 3, "#d58d74");
    if (p.facing !== "north") {
      const eye = p.facing === "west" ? -6 : p.facing === "east" ? 7 : -3;
      rect(x + eye, y - 32, 2, 3, "#2a304c");
      if (p.facing === "south") rect(x + 5, y - 32, 2, 3, "#2a304c");
    } else rect(x - 7, y - 35, 17, 8, "#49364a");
    rect(x - 11, y - 44, 25, 9, "#9c572e");
    rect(x - 9, y - 45, 21, 8, "#ffd047");
    rect(x - 6, y - 44, 14, 3, "#fff1a3");
    rect(x - 13, y - 37, 29, 4, "#ffad35");
    rect(x - 12, y - 37, 27, 1, "#ffe282");
  }
  return {
    draw(g, language) {
      if (!bg || cacheLanguage !== language) {
        scenery();
        bg = ctx.getImageData(0, 0, 960, 640);
        cacheLanguage = language;
      }
      ctx.putImageData(bg, 0, 0);
      const phase = phaseAt(g.time);
      for (const [x, y, axis] of [
        [333, 235, "h"],
        [665, 454, "h"],
        [395, 181, "v"],
        [605, 516, "v"],
      ])
        signal(x, y, axis, phase);
      for (const [x, y] of [
        [669, 242],
        [669, 459],
        [397, 242],
        [397, 459],
      ])
        signal(x, y, null, phase, true);
      marker(640, 187, t("homeSign"), "#177d80", g.time, true);
      if (g.player.y > 455 && g.status !== "won")
        marker(g.player.x, g.player.y - 35, t("startSign"), "#b63463", g.time);
      for (const v of [...g.vehicles].sort((a, b) => a.y - b.y))
        vehicle(v, g.time);
      player(g.player, g.time);
      if (g.collision) {
        const { x, y } = g.collision;
        ctx.strokeStyle = "#e9ba76";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      present();
    },
    gallery() {
      rect(0, 0, 960, 640, "#ead4ac");
      let row = 0;
      for (const kind of ["scooter", "sedan", "bus", "truck"]) {
        text(kind, 35, 80 + row * 145, 16, "#293f38");
        for (let lane = 0; lane < 4; lane++) {
          const directions = ["east", "west", "south", "north"];
          vehicle(
            createVehicle(kind, lane, {
              x: 220 + lane * 190,
              y: 80 + row * 145,
            }),
            0,
          );
          text(
            directions[lane],
            220 + lane * 190,
            120 + row * 145,
            12,
            "#293f38",
            "center",
          );
        }
        row++;
      }
      present();
    },
  };
}
