import * as cheerio from 'cheerio';

const UA = 'LammaCourseSeeker/0.1 (personal course search; contact: f.dehghan@skul.io)';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BlockedError extends Error {}

export async function fetchHtml(url, { timeoutMs = 30000 } = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
  if (res.url.includes('/challenge') || res.status === 403 || res.status === 429)
    throw new BlockedError(`Blocked by bot protection (${res.status}) at ${new URL(url).host}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export function htmlToText(html) {
  const $ = cheerio.load(html);
  $('script,style,nav,footer,header,noscript,svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}
