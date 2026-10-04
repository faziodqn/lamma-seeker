// Works today: you give programme page URLs in data/watchlist.json (array of strings
// or {url, name?}). Claude extracts everything else from the page itself.
import { readFileSync, existsSync } from 'node:fs';

export const name = 'watchlist';

export async function list() {
  const file = 'data/watchlist.json';
  if (!existsSync(file)) return [];
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  return raw.map((x) => (typeof x === 'string' ? { url: x } : x)).map((x) => ({ sourceId: x.url, ...x }));
}
