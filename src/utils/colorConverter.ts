import { parse, converter } from 'culori';

const toXYZ = converter('xyz65');
const toLab = converter('lab');
const toOKLch = converter('oklch');

export function colorConverter(color: string) {
  const parsed = parse(color);
  if (!parsed || parsed.mode !== 'rgb') return null;

  return {
    XYZ: toXYZ(parsed),
    Lab: toLab(parsed),
    OKLch: toOKLch(parsed)
  };
}
