// No-API path: load hand/assistant-written extractions from data/extractions/*.json
// (same fields Claude would return, plus "url" and optional "name") and score them.
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { store } from '../server/seek.js';

const dir = 'data/extractions';
const now = new Date().toISOString();
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const text = readFileSync(`${dir}/${f}`, 'utf8');
  const ex = JSON.parse(text);
  const item = { id: `manual:${ex.url}`, source: 'manual', url: ex.url, name: ex.programme_name };
  store(item, ex, createHash('sha1').update(text).digest('hex'), now);
}
