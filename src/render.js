import { BUILDINGS, LANES, phaseAt, createVehicle } from "./model.js?v=1.0.0";
const P = {
  asphalt: "#4e5b6d",
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
  // Two device pixels per logical unit keep lettering and fine pixel texture crisp.
  canvas.width = 1920;
  canvas.height = 1432;
  world.width = 1920;
  world.height = 1280;
  const ctx = world.getContext("2d");
  screen.imageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  let bg = null;
  let cacheLanguage = "";
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(
      Math.round(x * 2) / 2,
      Math.round(y * 2) / 2,
      Math.round(w * 2) / 2,
      Math.round(h * 2) / 2,
    );
  }
  function text(s, x, y, size = 12, c = P.cream, align = "left") {
    ctx.font = `600 ${size}px "Noto Sans CJK TC", "Noto Sans TC", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = c;
    ctx.fillText(s, Math.round(x), Math.round(y));
    ctx.textAlign = "left";
  }
  const sky = document.createElement("canvas");
  sky.width = 1920;
  sky.height = 152;
  const skyContext = sky.getContext("2d");
  skyContext.scale(2, 2);
  const skyBox = (x, y, w, h, c) => {
    skyContext.fillStyle = c;
    skyContext.fillRect(x, y, w, h);
  };
  // Atmospheric layers and warm cloud tops take their colour relationships from
  // the supplied reference, without importing its landmarks or perspective.
  for (let y = 0; y < 76; y++)
    skyBox(
      0,
      y,
      960,
      1,
      y < 18 ? "#239dd6" : y < 40 ? "#37b3df" : y < 58 ? "#63cbe8" : "#99e0e9",
    );
  for (const [x, y, w] of [
    [40, 19, 120],
    [252, 9, 88],
    [527, 24, 136],
    [790, 7, 116],
  ]) {
    skyBox(x, y + 9, w, 9, "#95d7e9");
    skyBox(x + 8, y + 3, w - 15, 15, "#c9edf0");
    skyBox(x + 20, y - 5, w * 0.38, 19, "#fff4d6");
    skyBox(x + w * 0.45, y - 1, w * 0.32, 14, "#fff9e5");
    skyBox(x + 13, y + 8, w - 19, 8, "#e5f5ec");
    skyBox(x + w * 0.32, y + 15, w * 0.53, 4, "#b3e1e8");
    for (let i = 0; i < 7; i++)
      skyBox(x + 11 + (i * w) / 8, y + 6 + (i % 3) * 3, 10, 1.5, "#fff8df");
  }
  for (let x = 0; x < 960; x += 4) {
    const y = 53 + Math.sin(x / 80) * 6 + Math.sin(x / 28) * 2;
    skyBox(x, y, 4, 76 - y, "#76bbcd");
  }
  for (let i = 0; i < 30; i++) {
    const x = i * 34,
      top = 51 + ((i * 11) % 17),
      w = 22 + (i % 3) * 3;
    skyBox(x, top, w, 76 - top, i % 2 ? "#68a9c0" : "#82becb");
    skyBox(x + 2, top - 2, w - 3, 2, "#c3e2dc");
    for (let wy = top + 4; wy < 76; wy += 5)
      for (let wx = x + 3; wx < x + w - 2; wx += 5)
        skyBox(wx, wy, 2, 2, i % 2 ? "#a4d1d4" : "#c5e5df");
  }
  function present() {
    screen.drawImage(sky, 0, 0);
    screen.drawImage(world, 0, 152);
  }
  function hash(x, y) {
    let n = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return (n ^ (n >>> 16)) >>> 0;
  }
  function grain(x, y, w, h, seed = 0) {
    for (let i = 0; i < Math.floor((w * h) / 45); i++) {
      const n = hash(i + seed, Math.floor(x + y));
      const px = x + (n % Math.max(1, Math.floor(w * 2))) / 2,
        py = y + ((n >>> 12) % Math.max(1, Math.floor(h * 2))) / 2;
      rect(px, py, 0.5 + (n % 3) * 0.5, 0.5, n % 2 ? "#fff0ca33" : "#5d587529");
    }
  }
  function foliage(x, y, seed) {
    const blob = (cx, cy, rx, ry, c) => {
      for (let dy = -ry; dy < ry; dy++) {
        const extent = Math.round(
          Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) * rx,
        );
        rect(cx - extent, cy + dy, extent * 2, 1, c);
      }
    };
    blob(x + 3, y + 9, 24, 7, "#23334c25");
    rect(x - 2, y - 20, 5, 24, "#65504b");
    rect(x - 1, y - 19, 1, 22, "#b18b5c");
    const colours = ["#155b55", "#1a7958", "#30984e", "#55b452", "#8dce60"];
    for (let i = 0; i < 14; i++) {
      const n = hash(seed, i),
        cx = x + (n % 35) - 17,
        cy = y - 14 - ((n >>> 9) % 28);
      const light = cy < y - 29 ? 2 + (i % 3) : i % 3;
      blob(cx, cy, 9 + (n % 6), 7 + ((n >>> 5) % 6), colours[light]);
    }
    for (let i = 0; i < 110; i++) {
      const n = hash(seed + 18, i),
        px = x + (n % 45) - 22,
        py = y - 40 + ((n >>> 10) % 34);
      if (Math.pow((px - x) / 25, 2) + Math.pow((py - y + 24) / 22, 2) < 1)
        rect(
          px,
          py,
          1.5 + (n % 3),
          0.5 + (n % 2),
          n % 4 ? "#a5da672d" : "#183f534d",
        );
    }
    for (let i = 0; i < 7; i++) {
      const n = hash(seed + 31, i);
      rect(x - 13 + (n % 26), y - 39 + ((n >>> 9) % 13), 2.5, 1, "#c5e68b");
    }
  }
  function planter(x, y) {
    rect(x - 18, y + 8, 37, 17, "#53465a");
    rect(x - 16, y + 9, 32, 14, "#b76550");
    rect(x - 15, y + 10, 8, 12, "#e59b66");
    rect(x + 9, y + 10, 6, 12, "#94514f");
    rect(x - 19, y + 7, 38, 4, "#edb27b");
    rect(x - 17, y + 8, 34, 1, "#ffe0a4");
    for (let i = 0; i < 6; i++) rect(x - 13 + i * 5, y + 14, 1, 8, "#ffdba535");
    foliage(x, y + 2, hash(x, y));
  }
  function window(x, y, w = 28, h = 30) {
    rect(x - 2, y - 2, w + 4, h + 4, "#39435d");
    rect(x, y, w, h, "#3b8da7");
    rect(x + 3, y + 3, w - 6, h - 6, "#76d2db");
    rect(x + 3, y + 3, w - 6, 5, "#b6edf0");
    for (let i = 0; i < 8; i++)
      rect(x + 4 + i * 1.5, y + 5 + i * 2, 2, 2, "#e6f8ed66");
    rect(x + 3, y + h - 4, w - 6, 1, "#187792");
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
    rect(x + 5, y + 11, w - 12, 1.5, "#fff0ce");
    rect(x + w - 8, y + 12, 4, h - 20, shade);
    for (let by = y + 16; by < y + 75; by += 6) {
      rect(x + 7, by, w - 18, 0.5, "#775c6c22");
      for (let bx = x + 8; bx < x + w - 13; bx += 13)
        rect(bx + (by % 12 ? 6 : 0), by, 0.5, 6, "#775c6c22");
    }
    grain(x + 7, y + 13, w - 20, 60, kind);
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
    rect(x + 6, y + 69, w - 12, 1, "#fff0d35c");
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
    for (let ty = b.y + 2; ty < b.y + 12; ty += 3)
      for (let tx = b.x + 12; tx < b.x + b.w - 12; tx += 12) {
        rect(tx, ty, 10, 0.5, "#fff3d578");
        rect(tx + 10, ty, 0.5, 3, "#526b7d44");
      }
    grain(b.x + 4, b.y + 23, b.w - 8, b.h - 28, kind ? 50 : 70);
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
        rect(x, y, 0.5 + (i % 3) * 0.5, 0.5, i % 2 ? "#637385" : "#455466");
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
    for (const [x, y, w, h] of [
      [0, 420, 325, 1],
      [676, 263, 284, 1],
      [411, 0, 1, 175],
      [589, 522, 1, 118],
    ])
      rect(x, y, w, h, "#8493a12b");
    // Four zebra crossings.
    for (let y = 265; y < 427; y += 20) {
      rect(350, y, 38, 11, "#ffefd3");
      rect(614, y, 38, 11, "#ffefd3");
    }
    for (let x = 414; x < 591; x += 21) {
      rect(x, 202, 12, 37, "#ffefd3");
      rect(x, 458, 12, 37, "#ffefd3");
    }
    rect(326, 363, 5, 72, "#fff2ce");
    rect(669, 254, 5, 73, "#fff2ce");
    rect(413, 177, 72, 5, "#fff2ce");
    rect(519, 516, 69, 5, "#fff2ce");
    // Lane arrows, authored at pixel scale.
    for (const [x, y, dir] of [
      [195, 389, 1],
      [774, 300, -1],
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
  function residence() {
    const x = 700,
      y = 49,
      w = 220,
      h = 171;
    rect(x + 7, y + 8, w, h, "#2b314a40");
    rect(x - 1, y, w + 2, h, "#3c506b");
    rect(x + 2, y + 5, w - 5, h - 7, "#afcdd0");
    rect(x + 5, y + 8, w - 13, h - 13, "#dce8d9");
    rect(x - 4, y - 4, w + 8, 10, "#466d88");
    rect(x, y - 2, w, 3, "#9cc8cf");
    grain(x + 5, y + 12, w - 14, h - 19, 63);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++) {
        const wx = x + 15 + col * 49,
          wy = y + 18 + row * 55;
        window(wx, wy, 28, 30);
        rect(wx - 4, wy + 31, 36, 5, "#789c9d");
        for (let j = 0; j < 6; j++)
          rect(wx - 2 + j * 6, wy + 27, 1, 8, "#416b7e");
        if ((col + row) % 3 === 0) {
          rect(wx + 1, wy + 27, 22, 3, "#439965");
          rect(wx + 4, wy + 25, 3, 3, "#efb85e");
        }
      }
    ac(875, 109);
    rect(711, 164, 199, 52, "#88b4bc");
    rect(716, 167, 188, 47, "#c4dbd4");
    rect(756, 168, 38, 48, "#405e70");
    rect(760, 172, 30, 40, "#648c93");
    rect(765, 175, 1, 32, "#acccbe");
    rect(784, 193, 3, 3, "#f5cf82");
    rect(807, 178, 83, 17, "#467f87");
    text(t("shopHome"), 848, 187, 13, "#fff0cd", "center");
    rect(708, 216, 204, 5, "#7e9da1");
    rect(713, 216, 194, 1, "#ecedce");
    // The home destination is a readable garden entrance on the original target.
    rect(611, 151, 77, 76, "#8caa9c");
    rect(614, 154, 71, 69, "#d9d8b6");
    for (let py = 158; py < 224; py += 8)
      for (let px = 617; px < 684; px += 12) {
        rect(px, py, 10, 6, (px + py) % 3 ? "#c8cbb0" : "#e8dfbd");
        rect(px, py, 10, 0.5, "#f6edce");
      }
    rect(615, 131, 69, 30, "#536f77");
    rect(619, 135, 61, 23, "#85b6aa");
    for (let i = 0; i < 8; i++) {
      rect(622 + i * 7, 138, 2, 20, "#cee1ba");
      rect(622 + i * 7, 138, 1, 20, "#eff1ce");
    }
    rect(610, 129, 79, 5, "#6b7379");
    rect(614, 124, 71, 5, "#ad6b60");
    rect(618, 120, 63, 4, "#cd8c6a");
    for (let i = 0; i < 8; i++) rect(621 + i * 7, 124, 5, 0.5, "#f2bc88");
    rect(607, 158, 6, 65, "#75998f");
    rect(687, 158, 6, 65, "#75998f");
    rect(608, 158, 3, 64, "#b6c8a7");
    rect(687, 158, 3, 64, "#b6c8a7");
    for (let i = 0; i < 7; i++) {
      rect(613, 159 + i * 4, 8, 2, "#458658");
      rect(680, 160 + i * 4, 8, 2, "#397954");
    }
    rect(625, 218, 48, 6, "#93aaa0");
    rect(625, 218, 48, 1, "#faf0ca");
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
    residence();
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
    grain(8, 231, 382, 11, 18);
    grain(606, 231, 346, 11, 19);
    grain(8, 460, 382, 175, 20);
    grain(606, 460, 346, 175, 21);
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
  }
  function vehicle(v, time) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(LANES[v.lane].axis === "h" ? 1.12 : 1.35, 1.1);
    ctx.translate(-v.x, -v.y);
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
        const cabin = x + (positive ? -5 : 5);
        rect(cabin - 12, y - width / 2 - 6, 24, 12, light);
        rect(cabin - 10, y - width / 2 - 4, 20, 7, "#3f6c7b");
        rect(cabin - 1, y - width / 2 - 5, 2, 9, dark);
        rect(cabin - 9, y - width / 2 - 3, 7, 1, "#bce8df");
        rect(x + (positive ? 10 : -20), y - width / 2 + 2, 10, 2, "#bee7e4");
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
    ctx.restore();
  }
  function player(p, time) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(0.9, 0.95);
    ctx.translate(-p.x, -p.y);
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
    ctx.restore();
  }
  return {
    draw(g, language) {
      if (!bg || cacheLanguage !== language) {
        scenery();
        bg = document.createElement("canvas");
        bg.width = 1920;
        bg.height = 1280;
        bg.getContext("2d").drawImage(world, 0, 0);
        cacheLanguage = language;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(bg, 0, 0);
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      const phase = phaseAt(g.time);
      for (const [x, y, axis] of [
        [333, 454, "h"],
        [665, 235, "h"],
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
