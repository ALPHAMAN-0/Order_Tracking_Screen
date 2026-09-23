/** No 0/O or 1/I — references are read aloud to support agents. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** "CASE-7K2P9Q". `rng` is injected so tests are deterministic. */
export function makeRef(prefix: 'CASE' | 'RF', rng: () => number, length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(rng() * ALPHABET.length)] ?? 'X';
  return `${prefix}-${out}`;
}
