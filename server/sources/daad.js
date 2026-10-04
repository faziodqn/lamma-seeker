// DAAD international programmes database. Currently unreachable from the dev machine
// (connection timeout), so the parser is not written yet. See hochschulkompass.js.
import { fetchHtml } from '../http.js';

export const name = 'daad';

export async function list() {
  await fetchHtml('https://www2.daad.de/deutschland/studienangebote/studiengaenge/en/');
  throw new Error('daad: reachable now - result parsing not implemented yet');
}
