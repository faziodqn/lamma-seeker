import express from 'express';
import ExcelJS from 'exceljs';
import { existsSync } from 'node:fs';
import { db } from './db.js';
import { seek } from './seek.js';
import { PROFILE, COURSES, DEGREE, ectsByArea, AREAS, ECTS_FACTOR } from './profile.js';

const app = express();
app.use(express.json());

const BW = 'baden';
const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

function shape(r) {
  const state = r.state ?? '';
  const newSince = Date.now() - 7 * 864e5;
  return {
    ...r,
    intake: parse(r.intake, []), gaps: parse(r.gaps, []), blockers: parse(r.blockers, []),
    extraction: undefined,
    bw_tuition_warning: state.toLowerCase().includes(BW),
    big_city: PROFILE.preferredBigCities.some((c) => r.city?.toLowerCase() === c.toLowerCase()),
    is_new_this_week: new Date(r.first_seen).getTime() > newSince,
    deadline_passed: r.deadline ? new Date(r.deadline) < new Date() : false,
  };
}

app.get('/api/programs', (_q, res) => {
  res.json(db.prepare('SELECT * FROM programs').all().map(shape));
});

app.patch('/api/programs/:id', (req, res) => {
  const { status, notes } = req.body;
  if (status) db.prepare('UPDATE programs SET status=? WHERE id=?').run(status, req.params.id);
  if (notes != null) db.prepare('UPDATE programs SET notes=? WHERE id=?').run(notes, req.params.id);
  res.json({ ok: true });
});

app.get('/api/meta', (_q, res) => {
  const last = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 1').get();
  res.json({
    profile: PROFILE, areas: AREAS, factors: ECTS_FACTOR,
    degree: DEGREE,
    totalUnits: COURSES.reduce((n, c) => n + c[1], 0),
    ects: { conservative: ectsByArea(ECTS_FACTOR.conservative), optimistic: ectsByArea(ECTS_FACTOR.optimistic) },
    lastRun: last && { ...last, errors: parse(last.errors, []) },
    seeking: seeking, apiKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

let seeking = false;
app.post('/api/seek', (_q, res) => {
  if (seeking) return res.status(409).json({ error: 'already running' });
  seeking = true;
  seek().catch((e) => console.error(e)).finally(() => { seeking = false; });
  res.json({ started: true });
});

app.post('/api/export', async (req, res) => {
  const ids = new Set(req.body?.ids ?? []);
  const rows = db.prepare('SELECT * FROM programs').all().map(shape).filter((r) => ids.size === 0 || ids.has(r.id));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Programmes');
  const yn = (v) => (v == null ? '?' : v ? 'yes' : 'no');
  ws.columns = [
    ['Programme', 'name', 38], ['University', 'university', 30], ['City', 'city', 14], ['State', 'state', 18],
    ['Degree', 'degree', 8], ['Field', 'field', 22], ['Language', 'language', 12], ['Intake', 'intake', 18],
    ['Deadline', 'deadline', 12], ['Tuition / sem (EUR)', 'tuition_semester', 12], ['BW tuition warning', 'bw', 10],
    ['Public', 'pub', 8], ['Accredited', 'acc', 10], ['Fit (conservative %)', 'fit_cons', 10], ['Fit (optimistic %)', 'fit_opt', 10],
    ['Verdict', 'verdict', 14], ['Blockers', 'blockers', 40], ['Missing prerequisites', 'gaps', 50],
    ['Uni-assist', 'ua', 10], ['Min grade (DE)', 'min_grade', 10], ['IELTS min', 'ielts_min', 9], ['German req', 'german_req', 10],
    ['Work exp (yrs)', 'work_exp', 10], ['Software focus /10', 'software_focus', 10], ['AI-heavy', 'ai', 9],
    ['Big city', 'big', 9], ['First seen', 'first_seen', 12], ['Status', 'status', 12], ['Notes', 'notes', 30], ['Link', 'url', 40],
  ].map(([header, key, width]) => ({ header, key, width }));
  for (const r of rows) {
    ws.addRow({
      ...r, intake: r.intake.join(', '), bw: r.bw_tuition_warning ? 'YES' : '', pub: yn(r.is_public), acc: yn(r.accredited),
      blockers: r.blockers.join('; '),
      gaps: r.gaps.map((g) => `${AREAS[g.area] ?? g.area}: need ${g.required}, have ${g.have}`).join('; '),
      ua: yn(r.uni_assist), ai: yn(r.ai_heavy), big: r.big_city ? 'yes' : '', first_seen: r.first_seen?.slice(0, 10),
      url: r.url ? { text: r.url, hyperlink: r.url } : '',
    });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];
  ws.autoFilter = { from: 'A1', to: { row: 1, column: ws.columns.length } };

  const ps = wb.addWorksheet('Lamma notes');
  ps.addRows([
    ['Fit score = share of required prerequisite credits you cover, per area, from your transcript.'],
    [`Conservative: 1 Iranian unit = ${ECTS_FACTOR.conservative} ECTS-equivalent. Optimistic: 1 unit = ${ECTS_FACTOR.optimistic}.`],
    ['Always verify against the official programme page; fit is an estimate.'],
  ]);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="lamma-courses-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

if (existsSync('web/dist')) {
  app.use(express.static('web/dist'));
}

const port = process.env.PORT || 4177;
app.listen(port, '127.0.0.1', () => console.log(`Lamma listening on http://localhost:${port}`));
