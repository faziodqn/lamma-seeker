// Inserts clearly-labelled DEMO rows (fake) so you can try the UI/filters/export.
// Remove with: node scripts/demo-seed.js --clear
import { db } from '../server/db.js';

if (process.argv.includes('--clear')) {
  db.exec('DELETE FROM programs WHERE is_demo = 1');
  console.log('demo rows removed'); process.exit(0);
}
const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const rows = [
  ['Software Systems Engineering (DEMO)', 'Demo Uni Berlin', 'Berlin', 'Berlin', 'M.Sc.', 'Software Engineering', 'English', 0, 280, 82, 96, 'strong', 8, 0, 2, '2027-05-31'],
  ['Computer Science (DEMO)', 'Demo TU Munich', 'München', 'Bavaria', 'M.Sc.', 'Computer Science', 'English', 0, 150, 58, 88, 'optimistic-only', 6, 0, 5, '2027-01-31'],
  ['Web & IT Systems (DEMO)', 'Demo HAW Hamburg', 'Hamburg', 'Hamburg', 'M.Sc.', 'Information Technology', 'English', 0, 300, 90, 100, 'strong', 9, 0, 1, '2027-06-15'],
  ['Applied CS (DEMO)', 'Demo Uni Stuttgart', 'Stuttgart', 'Baden-Württemberg', 'M.Sc.', 'Computer Science', 'English', 1500, 170, 74, 93, 'partial', 7, 0, 3, '2027-03-15'],
  ['Machine Learning & Data (DEMO)', 'Demo Uni Tübingen', 'Tübingen', 'Baden-Württemberg', 'M.Sc.', 'Machine Learning', 'English', 1500, 170, 40, 70, 'weak', 2, 1, 4, '2027-04-30'],
  ['Software Engineering (DEMO)', 'Demo Uni Leipzig', 'Leipzig', 'Saxony', 'M.Sc.', 'Software Engineering', 'English', 0, 220, 85, 99, 'strong', 8, 0, 1, '2026-09-01'],
];
const ins = db.prepare(`INSERT OR REPLACE INTO programs (id, source, name, university, city, state, degree, field, language, intake, deadline,
  tuition_semester, contribution, is_public, accredited, url, uni_assist, min_grade, ielts_min, german_req, ai_heavy, software_focus,
  fit_cons, fit_opt, verdict, gaps, blockers, summary, first_seen, last_seen, is_demo)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,?,1,2.5,6.5,'A1',?,?,?,?,?,?,?,?,?,?,1)`);
rows.forEach((r, i) => {
  const [name, uni, city, state, degree, field, lang, tuition, contrib, fc, fo, verdict, sw, ai, daysAgo, deadline] = r;
  const gaps = fc < 90 ? [{ area: 'theoretical_cs', required: 30, have: 21, missing: 9 }] : [];
  ins.run(`demo:${i}`, 'demo', name, uni, city, state, degree, field, lang, JSON.stringify(['WS2027/28']), deadline,
    tuition, contrib, 'https://example.org/demo', ai, sw, fc, fo, verdict, JSON.stringify(gaps), '[]',
    'Demo row: not a real programme.', iso(daysAgo), iso(0));
});
console.log('demo rows inserted');
