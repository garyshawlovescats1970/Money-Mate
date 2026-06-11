// Generates the PWA icons (brand-gradient rounded square with a white "M")
// without any native image dependency — hand-rolled PNG encoder over zlib.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, c]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Distance from point to line segment, for stroking the "M".
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
  );
  const cx = x1 + t * dx,
    cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function renderIcon(size, { rounded = true } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = rounded ? size * 0.22 : 0;
  // Brand gradient endpoints
  const a = [0x8b, 0x7c, 0xff];
  const b = [0x5b, 0x8c, 0xff];
  // "M" strokes in unit space (x, y in 0..1)
  const m = [
    [0.28, 0.68, 0.28, 0.34],
    [0.28, 0.34, 0.5, 0.58],
    [0.5, 0.58, 0.72, 0.34],
    [0.72, 0.34, 0.72, 0.68],
  ];
  const stroke = size * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // rounded-corner alpha
      let alpha = 255;
      if (radius > 0) {
        const cx = Math.max(radius - x, x - (size - 1 - radius), 0);
        const cy = Math.max(radius - y, y - (size - 1 - radius), 0);
        if (cx > 0 && cy > 0) {
          const d = Math.hypot(cx, cy);
          alpha = d > radius ? 0 : d > radius - 1.5 ? Math.round(255 * (radius - d) / 1.5) : 255;
        }
      }
      // diagonal gradient
      const t = (x + y) / (2 * (size - 1));
      let r = Math.round(a[0] + (b[0] - a[0]) * t);
      let g = Math.round(a[1] + (b[1] - a[1]) * t);
      let bl = Math.round(a[2] + (b[2] - a[2]) * t);
      // white "M"
      const ux = x / (size - 1),
        uy = y / (size - 1);
      let dMin = Infinity;
      for (const [x1, y1, x2, y2] of m) {
        dMin = Math.min(dMin, distToSeg(ux * size, uy * size, x1 * size, y1 * size, x2 * size, y2 * size));
      }
      if (dMin < stroke) {
        const blend = dMin > stroke - 1.5 ? (stroke - dMin) / 1.5 : 1;
        r = Math.round(r + (255 - r) * blend);
        g = Math.round(g + (255 - g) * blend);
        bl = Math.round(bl + (255 - bl) * blend);
      }
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = bl;
      rgba[i + 3] = alpha;
    }
  }
  return encodePNG(size, rgba);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", renderIcon(192));
writeFileSync("public/icons/icon-512.png", renderIcon(512));
// Apple touch icons must be opaque squares — iOS applies its own mask.
writeFileSync("public/icons/apple-touch-icon.png", renderIcon(180, { rounded: false }));
console.log("Icons written to public/icons/");
