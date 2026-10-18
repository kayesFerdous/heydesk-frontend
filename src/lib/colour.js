// A business's colour (backend D82) as "#rrggbb". Light ones need dark words on
// them; public/widget.js has the same check for the bubble.
export function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}
