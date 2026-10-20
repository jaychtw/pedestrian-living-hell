import { BUILDINGS, LANES, phaseAt, createVehicle } from "./model.js";
const P = {
  asphalt: "#536561",
  edge: "#c0bdaa",
  walk: "#c8c6ad",
  tile: "#b4b79f",
  ink: "#293f38",
  cream: "#f1e7bf",
  gold: "#dfb468",
  green: "#719078",
};
export function createRenderer(canvas, t) {
  const ctx = canvas.getContext("2d");
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
  function line(x, y, w, h, c) {
    rect(x, y, w, h, c);
  }
  function planter(x, y) {
    rect(x - 15, y + 9, 32, 15, "#8d8c72");
    rect(x - 12, y + 22, 26, 4, "#6a7664");
    rect(x - 2, y - 5, 5, 21, "#6a7056");
    rect(x - 17, y - 14, 29, 22, "#456e54");
    rect(x - 11, y - 25, 25, 25, "#557e59");
    rect(x - 20, y - 9, 37, 12, "#628962");
    rect(x - 9, y - 19, 12, 8, "#78996a");
    rect(x + 8, y - 6, 8, 8, "#3c654d");
  }
  function window(x, y, w = 28, h = 30) {
    rect(x, y, w, h, "#3c5b53");
    rect(x + 3, y + 3, w - 6, h - 6, "#6e8b7f");
    rect(x + w / 2 - 1, y + 2, 2, h - 4, "#a4b19a");
    rect(x + 2, y + h / 2, w - 4, 2, "#9eaa92");
    rect(x + 4, y + 5, 6, h / 2 - 5, "#9cafa0");
    rect(x - 3, y + h, w + 6, 4, "#b8b69b");
  }
  function ac(x, y) {
    rect(x, y, 26, 17, "#a4ab98");
    rect(x + 3, y + 3, 12, 11, "#748877");
    for (let i = 0; i < 4; i++) rect(x + 18, y + 3 + i * 3, 6, 1, "#627966");
  }
  function facade(x, y, w, h, kind) {
    const colors =
      kind === 0
        ? ["#c8bfa0", "#9d9e82"]
        : kind === 1
          ? ["#b9c1a6", "#8d9f89"]
          : ["#d4c4a2", "#a29d81"];
    rect(x + 8, y + 10, w, h, "#53695650");
    rect(x, y, w, h, colors[1]);
    rect(x + 3, y + 8, w - 6, h - 8, colors[0]);
    rect(x - 3, y, w + 6, 8, "#697d6b");
    rect(x + 1, y + 10, w - 2, 3, "#e2d5b1");
    for (let wx = x + 14; wx < x + w - 20; wx += 44) window(wx, y + 20, 26, 27);
    ac(x + w - 39, y + 54);
    rect(x + 3, y + 57, w - 6, 4, "#a6aa8e");
    const signColor =
      kind === 0 ? "#47775d" : kind === 1 ? "#a85e45" : "#b49556";
    rect(x + 6, y + 77, w - 12, 28, signColor);
    rect(x + 9, y + 80, w - 18, 2, "#d1bb82");
    text(
      t(["shopTea", "shopFood", "shopMarket"][kind]),
      x + w / 2,
      y + 91,
      18,
      "#f5e5b3",
      "center",
    );
    rect(x + 10, y + 107, w - 20, h - 109, "#4a6256");
    for (let wx = x + 15; wx < x + w - 16; wx += 23) {
      rect(wx, y + 111, 17, h - 119, "#8b9e85");
      rect(wx + 3, y + 113, 4, h - 123, "#b1bba1");
    }
    rect(x + 6, y + h - 7, w - 12, 7, "#6e7d67");
    for (let a = 0; a < Math.floor(w / 12); a++)
      rect(x + 3 + a * 12, y + 105, 12, 8, a % 2 ? "#e3d3a8" : signColor);
  }
  function shortBlock(b, kind) {
    rect(b.x + 9, b.y + 8, b.w, b.h, "#62756250");
    rect(b.x, b.y + 18, b.w, b.h - 18, kind ? "#a4b49d" : "#bcb39a");
    rect(b.x - 3, b.y + 10, b.w + 6, 13, "#87957d");
    rect(b.x + 2, b.y, b.w - 4, 14, kind ? "#c5c7ab" : "#d2c5a5");
    rect(b.x + 10, b.y + 4, b.w - 20, 5, "#b8b79a");
    for (let x = b.x + 17; x < b.x + b.w - 20; x += 46)
      window(x, b.y + 36, 28, 28);
    rect(b.x + 12, b.y + 81, b.w - 24, 25, kind ? "#577b68" : "#967458");
    text(
      t(kind ? "shopClinic" : "shopRepair"),
      b.x + b.w / 2,
      b.y + 94,
      16,
      P.cream,
      "center",
    );
    for (let x = b.x + 20; x < b.x + b.w - 25; x += 19) {
      rect(x, b.y + 108, 14, 10, "#566d5c");
    }
    ac(b.x + b.w - 49, b.y + 31);
  }
  function road() {
    rect(0, 0, 960, 640, "#b3b69b");
    rect(0, 234, 960, 221, "#a9ad96");
    rect(400, 0, 200, 640, "#a9ad96");
    rect(0, 248, 960, 193, P.asphalt);
    rect(407, 0, 186, 640, P.asphalt);
    // Fixed little flecks make the tarmac read as pixel art rather than a flat fill.
    for (let i = 0; i < 1400; i++) {
      const x = (i * 149 + 31) % 960,
        y = (i * 67 + 17) % 640;
      if ((y > 249 && y < 440) || (x > 408 && x < 592))
        rect(x, y, 2, 1, i % 2 ? "#5b6d65" : "#4c605b");
    }
    rect(0, 245, 402, 3, "#d8cda4");
    rect(599, 245, 361, 3, "#d8cda4");
    rect(0, 441, 402, 3, "#d8cda4");
    rect(599, 441, 361, 3, "#d8cda4");
    rect(404, 0, 3, 242, "#d8cda4");
    rect(594, 0, 3, 242, "#d8cda4");
    rect(404, 447, 3, 193, "#d8cda4");
    rect(594, 447, 3, 193, "#d8cda4");
    // Double yellow center lines and directional lane dashes.
    for (const y of [341, 347]) {
      rect(0, y, 325, 2, "#d7bd76");
      rect(675, y, 285, 2, "#d7bd76");
    }
    for (const x of [497, 503]) {
      rect(x, 0, 2, 174, "#d7bd76");
      rect(x, 522, 2, 118, "#d7bd76");
    }
    // Four zebra crossings.
    for (let y = 265; y < 427; y += 20) {
      rect(350, y, 38, 11, "#e1dfc5");
      rect(614, y, 38, 11, "#e1dfc5");
    }
    for (let x = 414; x < 591; x += 21) {
      rect(x, 202, 12, 37, "#e1dfc5");
      rect(x, 458, 12, 37, "#e1dfc5");
    }
    rect(326, 254, 5, 72, "#eee4be");
    rect(669, 363, 5, 73, "#eee4be");
    rect(413, 177, 72, 5, "#eee4be");
    rect(519, 516, 69, 5, "#eee4be");
    // Lane arrows, authored at pixel scale.
    for (const [x, y, dir] of [
      [195, 300, 1],
      [774, 389, -1],
    ]) {
      rect(x - 14, y - 2, 28, 4, "#b4c0ac");
      for (let i = 0; i < 4; i++)
        rect(x + dir * (i * 4), y - 8 + i * 2, 4, 16 - i * 4, "#b4c0ac");
    }
    for (const [x, y, dir] of [
      [456, 120, 1],
      [544, 568, -1],
    ]) {
      rect(x - 2, y - 14, 4, 28, "#b4c0ac");
      for (let i = 0; i < 4; i++)
        rect(x - 8 + i * 2, y + dir * (i * 4), 16 - i * 4, 4, "#b4c0ac");
    }
    for (let x = 12; x < 960; x += 27)
      for (const y of [237, 449])
        if (x < 397 || x > 602) rect(x, y, 19, 2, "#d2c5a1");
    for (const [x, y] of [
      [305, 228],
      [679, 228],
      [303, 453],
      [684, 453],
    ]) {
      rect(x, y, 21, 9, "#697d6d");
      for (let i = 0; i < 5; i++) rect(x + 3 + i * 4, y + 1, 1, 7, "#a4ad92");
    }
  }
  function scenery() {
    road();
    // Low front-facing row along the upper edge, with water tanks and roof detail.
    rect(8, 26, 384, 24, "#6a826d");
    rect(18, 16, 365, 17, "#9baa8c");
    for (let x = 26; x < 380; x += 27) rect(x, 18, 19, 11, "#b3b99a");
    rect(48, 0, 36, 19, "#879f8b");
    rect(44, 5, 44, 4, "#c6ccb0");
    rect(50, 18, 32, 4, "#617e6b");
    facade(18, 51, 122, 157, 0);
    facade(143, 51, 139, 157, 1);
    facade(285, 51, 100, 157, 2);
    rect(687, 32, 255, 16, "#6d8b77");
    rect(697, 18, 235, 16, "#a5b89c");
    rect(874, 3, 34, 23, "#8ea994");
    rect(870, 9, 42, 4, "#ccd3b7");
    facade(700, 49, 220, 171, 0);
    rect(709, 123, 202, 27, "#547c6e");
    text(t("shopHome"), 810, 137, 19, P.cream, "center");
    rect(771, 164, 33, 52, "#385b50");
    rect(775, 167, 25, 45, "#7c9a86");
    rect(795, 188, 3, 4, "#e7d4a0");
    rect(709, 220, 200, 6, "#879d81");
    // Vertical shop blades and small stools, pots and lanterns.
    rect(22, 87, 24, 82, "#a4543f");
    for (let i = 0; i < 2; i++)
      text(
        [...t("shopTea")][i] || "",
        34,
        108 + i * 27,
        20,
        "#f2d6a0",
        "center",
      );
    rect(288, 86, 22, 79, "#e4c876");
    for (let i = 0; i < 3; i++)
      text(
        [...t("shopMarket")][i] || "",
        299,
        101 + i * 22,
        16,
        "#45684f",
        "center",
      );
    for (let x = 164; x < 275; x += 36) {
      rect(x, 208, 13, 8, "#a56d4e");
      rect(x + 1, 216, 3, 8, "#886a4d");
      rect(x + 9, 216, 3, 8, "#886a4d");
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
      rect(70 + i * 37, 465, 24, 11, "#6a8170");
      rect(75 + i * 37, 461, 12, 8, i % 2 ? "#d4bb79" : "#a67c61");
      rect(72 + i * 37, 474, 6, 4, P.ink);
      rect(87 + i * 37, 474, 6, 4, P.ink);
    }
    rect(363, 538, 23, 43, "#899b83");
    rect(366, 541, 17, 25, "#b1b69a");
    rect(368, 545, 13, 2, "#788e79");
    rect(372, 571, 6, 2, "#d3c89c");
    rect(940, 493, 6, 100, "#667d68");
    rect(935, 490, 16, 7, "#d4c89a");
    rect(937, 486, 12, 5, "#dbbe76");
    // Road-name plates are environmental signage, translated centrally.
    rect(17, 449, 83, 18, "#477561");
    text(t("roadA"), 58, 459, 11, P.cream, "center");
    rect(601, 26, 20, 75, "#477561");
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
    rect(x - 23, y + 19, 46, 12, "#314e3520");
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 24, y + 9, 48, 29);
    ctx.setLineDash([]);
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
      scooter: ["#b88c56", "#e1be7a"],
      sedan: ["#a2b7a2", "#c6d0b0"],
      bus: ["#b4b58c", "#e0d5a4"],
      truck: ["#7d9d9a", "#b2beb0"],
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
    if (v.violator) {
      const by = y - 30 - Math.round(Math.sin(time * 8) * 2);
      rect(x - 7, by - 8, 15, 15, "#e0ad63");
      text(t("violation"), x + 1, by, 12, "#473e2c", "center");
      for (let i = 1; i <= 3; i++) rect(x - 20 - i * 9, y - 1, 5, 2, "#d6b16a");
    }
  }
  function player(p, time) {
    const x = Math.round(p.x),
      y = Math.round(p.y),
      stride = p.walking ? (Math.sin(time * 18) > 0 ? 2 : -2) : 0;
    rect(x - 8, y + 4, 16, 5, "#314e3544");
    rect(x - 5, y - 8, 11, 11, "#d7944b");
    rect(x - 7, y - 7, 3, 8, "#e3b37a");
    rect(x + 6, y - 7, 3, 8, "#e3b37a");
    rect(x - 5, y + 3, 4, 5 + stride, "#3b554c");
    rect(x + 2, y + 3, 4, 5 - stride, "#3b554c");
    rect(x - 5, y + 7 + stride, 4, 2, "#d5cdad");
    rect(x + 2, y + 7 - stride, 4, 2, "#d5cdad");
    rect(x - 5, y - 20, 11, 12, "#d8b182");
    rect(x - 6, y - 21, 13, 5, "#3c5142");
    rect(x - 6, y - 18, p.facing === "west" ? 3 : 12, 4, "#3c5142");
    if (p.facing !== "north") {
      rect(x + (p.facing === "west" ? -5 : 3), y - 15, 2, 2, "#364c3c");
    }
    if (p.facing === "north") {
      rect(x - 4, y - 8, 9, 9, "#a26a3e");
      rect(x - 2, y - 6, 5, 6, "#c18343");
    }
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
      marker(640, 187, t("homeSign"), "#557b5d", g.time, true);
      if (g.player.y > 455 && g.status !== "won")
        marker(640, 558, t("startSign"), "#ae7d45", g.time);
      const actors = [
        ...g.vehicles.map((v) => ({ y: v.y, draw: () => vehicle(v, g.time) })),
        { y: g.player.y, draw: () => player(g.player, g.time) },
      ].sort((a, b) => a.y - b.y);
      for (const a of actors) a.draw();
      if (g.collision) {
        const { x, y } = g.collision;
        ctx.strokeStyle = "#e9ba76";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    gallery() {
      rect(0, 0, 960, 640, "#b3b69b");
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
    },
  };
}
