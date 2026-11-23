const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export function rgbToHex(rgb) {
  return '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('');
}

export function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const inGamut = (lin) => lin.every((c) => c >= -1e-6 && c <= 1 + 1e-6);

export function oklchToHex(L, C, H) {
  const toLab = (c) => [L, c * Math.cos((H * Math.PI) / 180), c * Math.sin((H * Math.PI) / 180)];
  let lin = oklabToLinear(toLab(C));
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinear(toLab(mid)))) lo = mid;
      else hi = mid;
    }
    lin = oklabToLinear(toLab(lo));
  }
  return rgbToHex(lin.map((c) => linearToSrgb(clamp01(c))));
}

export function parseColor(value) {
  const v = value.trim();
  if (v.startsWith('#')) return v.slice(0, 7).toLowerCase();
  const m = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!m) throw new Error(`Unsupported color: ${value}`);
  return oklchToHex(Number(m[1]), Number(m[2]), Number(m[3]));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcag(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function apca(txt, bg) {
  const y = (hex) => {
    const [r, g, b] = hexToRgb(hex);
    let v = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
    if (v < 0.022) v += (0.022 - v) ** 1.414;
    return v;
  };
  const yt = y(txt);
  const yb = y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

export function blend(top, bottom, alpha) {
  const t = hexToRgb(top);
  const b = hexToRgb(bottom);
  return rgbToHex(t.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export const VISIONS = ['normal', 'protan', 'deutan', 'tritan'];

export function simulate(hex, vision) {
  if (vision === 'normal') return hex;
  const lin = hexToRgb(hex).map(srgbToLinear);
  const out = CVD[vision].map((row) => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
  return rgbToHex(out.map(linearToSrgb));
}

export function deltaE(a, b) {
  const la = linearToOklab(hexToRgb(a).map(srgbToLinear));
  const lb = linearToOklab(hexToRgb(b).map(srgbToLinear));
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

export function withAlpha(hex, a) {
  return hex.slice(0, 7) + Math.round(Math.min(1, Math.max(0, a)) * 255).toString(16).padStart(2, '0');
}

export function shiftL(hex, dL) {
  const lab = linearToOklab(hexToRgb(hex).map(srgbToLinear));
  const C = Math.hypot(lab[1], lab[2]);
  const H = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  return oklchToHex(Math.min(0.99, Math.max(0, lab[0] + dL)), C, H);
}

export function flatten(color, bg) {
  if (color.length === 9) return blend(color.slice(0, 7), bg.slice(0, 7), parseInt(color.slice(7), 16) / 255);
  return color.slice(0, 7);
}
