const EMPTY = '#F2F2F2';

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const ALPHAS = [0, 0.18, 0.45, 0.78, 1];

export function intensityToRGBA(hex: string, count: number): string {
  if (count <= 0) return EMPTY;
  const alpha = count >= 4 ? 1 : ALPHAS[count];
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}