function hexToRgb(hex: string) {
  if (!/^#([0-9a-f]{6})$/i.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

// Apply sRGB companding (gamma correction)
function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// RGB → XYZ (D65)
function rgbToXyz({ r, g, b }: { r: number; g: number; b: number }) {
  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);

  return {
    x: r * 0.4124 + g * 0.3576 + b * 0.1805,
    y: r * 0.2126 + g * 0.7152 + b * 0.0722,
    z: r * 0.0193 + g * 0.1192 + b * 0.9505
  };
}

// XYZ → Lab
function xyzToLab({ x, y, z }: { x: number; y: number; z: number }) {
  // D65 reference white
  const Xn = 0.95047;
  const Yn = 1.00000;
  const Zn = 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116);

  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

// RGB → OKLab → OKLCH
function rgbToOklch({ r, g, b }: { r: number; g: number; b: number }) {
  // Linear RGB
  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);

  // RGB → LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Non-linear transformation
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS → OKLab
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + b_ * b_);
  const h = Math.atan2(b_, a) * (180 / Math.PI);
  const H = (h + 360) % 360;

  return { L, C, h: H };
}

export function colorConverter(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return null;

  const XYZ = rgbToXyz(rgb);
  const Lab = xyzToLab(XYZ);
  const OKLch = rgbToOklch(rgb);

  return { XYZ, Lab, OKLch };
}
