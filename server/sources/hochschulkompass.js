// Hochschulkompass search sits behind a bot challenge (/.enodia/challenge) when called
// without a browser, so this adapter reports that instead of trying to bypass it.
// If you obtain a permitted route (export, data agreement, or running from a browser
// session you control) implement list() here and the rest of the pipeline is unchanged.
import { fetchHtml } from '../http.js';

export const name = 'hochschulkompass';

export async function list() {
  const q = 'tx_szhrksearch_pi1';
  const url = `https://www.hochschulkompass.de/en/degree-programmes/study-in-germany-search/advanced-degree-programme-search.html?${q}%5Bsearch%5D=1&${q}%5Bstudtyp%5D=3&${q}%5Bfach%5D=software&${q}%5Babschluss%5D%5B%5D=3`;
  await fetchHtml(url); // throws BlockedError while the challenge is active
  throw new Error('hochschulkompass: result parsing not implemented yet (search is reachable now - add parser)');
}
