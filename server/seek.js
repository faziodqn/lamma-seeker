import { execFile } from 'node:child_process';
import { db } from './db.js';
import { PROFILE } from './profile.js';
import { assess, extractWithClaude, hashText, isAiHeavy } from './matcher.js';
import { fetchHtml, htmlToText, sleep } from './http.js';
import * as watchlist from './sources/watchlist.js';
import * as hochschulkompass from './sources/hochschulkompass.js';
import * as daad from './sources/daad.js';

const SOURCES = [hochschulkompass, daad, watchlist];
const b = (v) => (v == null ? null : v ? 1 : 0);

function hardReject(p) {
  if (p.is_public === 0) return 'private institution';
  if (PROFILE.avoidCities.some((c) => p.city?.toLowerCase().includes(c.toLowerCase()))) return `city avoided (${p.city})`;
  const lang = (p.language ?? '').toLowerCase();
  if (lang && !lang.includes('english')) return 'not English-taught';
  if (p.tuition_semester != null && p.tuition_semester * 2 > PROFILE.maxTuitionPerYear) return 'tuition above cap';
  return null;
}

async function analyse(item) {
  const html = await fetchHtml(item.url);
  const text = htmlToText(html);
  const hash = hashText(text);
  const existing = db.prepare('SELECT content_hash FROM programs WHERE id = ?').get(item.id);
  if (existing?.content_hash === hash) return { unchanged: true };
  const ex = await extractWithClaude(text, item);
  return { hash, ex };
}

export function store(item, ex, hash, now, log = console.log) {
  const row = {
    name: ex.programme_name ?? item.name, university: ex.university ?? item.university, city: ex.city ?? item.city,
    state: ex.german_state ?? item.state, degree: ex.degree, field: ex.field, language: ex.language_of_instruction,
    is_public: b(ex.is_public), tuition_semester: ex.tuition_per_semester_eur,
  };
  const reject = hardReject(row);
  if (reject) { log(`  skip ${row.name}: ${reject}`); return null; }
  const a = assess(ex);
  const existed = db.prepare('SELECT id FROM programs WHERE id=?').get(item.id);
  db.prepare(`INSERT INTO programs (id, source, name, university, city, state, degree, field, language, intake, deadline,
      tuition_semester, contribution, is_public, accredited, url, uni_assist, min_grade, ielts_min, german_req, work_exp, gre,
      ai_heavy, software_focus, fit_cons, fit_opt, verdict, gaps, blockers, summary, extraction, content_hash, first_seen, last_seen)
    VALUES (@id,@source,@name,@university,@city,@state,@degree,@field,@language,@intake,@deadline,
      @tuition_semester,@contribution,@is_public,@accredited,@url,@uni_assist,@min_grade,@ielts_min,@german_req,@work_exp,@gre,
      @ai_heavy,@software_focus,@fit_cons,@fit_opt,@verdict,@gaps,@blockers,@summary,@extraction,@content_hash,@now,@now)
    ON CONFLICT(id) DO UPDATE SET name=@name, university=@university, city=@city, state=@state, degree=@degree, field=@field,
      language=@language, intake=@intake, deadline=@deadline, tuition_semester=@tuition_semester, contribution=@contribution,
      is_public=@is_public, accredited=@accredited, uni_assist=@uni_assist, min_grade=@min_grade, ielts_min=@ielts_min,
      german_req=@german_req, work_exp=@work_exp, gre=@gre, ai_heavy=@ai_heavy, software_focus=@software_focus,
      fit_cons=@fit_cons, fit_opt=@fit_opt, verdict=@verdict, gaps=@gaps, blockers=@blockers, summary=@summary,
      extraction=@extraction, content_hash=@content_hash, last_seen=@now`).run({
    id: item.id, source: item.source, ...row, intake: JSON.stringify(ex.intake ?? []), deadline: ex.deadline ?? null,
    contribution: ex.semester_contribution_eur ?? null, accredited: b(ex.accredited), url: item.url,
    uni_assist: b(ex.uni_assist), min_grade: ex.min_grade_german ?? null, ielts_min: ex.ielts_min ?? null,
    german_req: ex.german_required ?? null, work_exp: ex.work_experience_required_years ?? null, gre: b(ex.gre_required),
    ai_heavy: b(isAiHeavy(ex)), software_focus: ex.software_focus ?? null, fit_cons: a.fit_cons, fit_opt: a.fit_opt,
    verdict: a.verdict, gaps: JSON.stringify(a.gaps), blockers: JSON.stringify(a.blockers), summary: ex.summary ?? null,
    extraction: JSON.stringify(ex), content_hash: hash, now,
  });
  log(`  ${existed ? 'updated' : 'NEW'} ${row.name} (${row.university}) fit ${a.fit_cons}/${a.fit_opt} ${a.verdict}`);
  return { existed: Boolean(existed) };
}

export async function seek({ log = console.log } = {}) {
  const started = new Date().toISOString();
  const errors = [];
  let found = 0, newCount = 0;
  const now = started;

  for (const src of SOURCES) {
    let items = [];
    try { items = await src.list(); } catch (e) { errors.push(`${src.name}: ${e.message}`); log(`[${src.name}] ${e.message}`); continue; }
    log(`[${src.name}] ${items.length} candidates`);
    for (const raw of items) {
      const item = { ...raw, id: `${src.name}:${raw.sourceId}`, source: src.name };
      try {
        const r = await analyse(item);
        if (r.unchanged) { db.prepare('UPDATE programs SET last_seen=? WHERE id=?').run(now, item.id); continue; }
        const saved = store(item, r.ex, r.hash, now, log);
        if (!saved) continue;
        found++;
        if (!saved.existed) newCount++;
      } catch (e) {
        errors.push(`${item.url}: ${e.message}`); log(`  error ${item.url}: ${e.message}`);
      }
      await sleep(1500);
    }
  }

  db.prepare('INSERT INTO runs (started_at, finished_at, found, new_count, errors) VALUES (?,?,?,?,?)')
    .run(started, new Date().toISOString(), found, newCount, JSON.stringify(errors));
  if (newCount > 0) execFile('notify-send', ['Lamma found new courses 🦙', `${newCount} new matching Master's programmes`], () => {});
  return { found, newCount, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seek().then((r) => { console.log(r); process.exit(0); });
}
