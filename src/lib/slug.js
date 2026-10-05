// A short id for a new item ("Chicken Biryani" becomes "chicken-biryani"),
// made unique among the codes that already exist.
export function makeCode(name, existingCodes) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  let code = base;
  let n = 2;
  while (existingCodes.includes(code)) {
    code = `${base}-${n}`;
    n += 1;
  }
  return code;
}
