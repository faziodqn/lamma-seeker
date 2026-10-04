import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Scene from './Scene.jsx';

const VERDICT = { strong: 'Strong match', 'optimistic-only': 'Only if credits count 1:2', partial: 'Partial', weak: 'Weak', blocked: 'Blocked', unknown: 'Unknown' };
const why = (r) => {
  if (r.verdict === 'blocked') return `Blocked because: ${r.blockers.join('; ')}. Fix these first, whatever the credits say.`;
  if (r.verdict === 'unknown') return 'Unknown: the programme page lists no credit-point prerequisites per subject, so no fit score could be computed. Read the admission rules yourself.';
  const f = `Your transcript covers ${r.fit_cons}% of the required credits (1 unit = 1 ECTS)${r.fit_opt != null ? `, ${r.fit_opt}% if 1 unit = 2 ECTS` : ''}.`;
  const rule = { strong: 'Strong = 90% or more.', 'optimistic-only': 'Only if credits count 1:2 = under 90% at 1:1 but 90% or more at 1:2.', partial: 'Partial = 60–89%.', weak: 'Weak = under 60%.' }[r.verdict];
  return `${f} ${rule}`;
};
const STATUSES = ['new', 'interested', 'applied', 'rejected'];
const COLS = [
  ['name', 'Programme'], ['university', 'University'], ['city', 'City'], ['deadline', 'Deadline'],
  ['tuition_semester', 'Tuition'], ['fit_cons', 'Fit'], ['verdict', 'Verdict'], ['status', 'Status'],
];

export default function App() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [mood, setMood] = useState('idle');
  const [sort, setSort] = useState({ key: 'fit_cons', dir: -1 });
  const [open, setOpen] = useState(null);
  const [f, setF] = useState({
    q: '', hideBlocked: true, hidePassed: true, hideAI: true, bigCityOnly: false,
  });
  const prevNew = useRef(null);

  const load = async () => {
    const [p, m] = await Promise.all([fetch('/api/programs').then((r) => r.json()), fetch('/api/meta').then((r) => r.json())]);
    setRows(p); setMeta(m);
    const n = p.filter((r) => r.is_new_this_week).length;
    if (prevNew.current != null && n > prevNew.current) celebrate(n - prevNew.current);
    prevNew.current = n;
    return m;
  };
  const celebrate = (n) => {
    setMood('party'); setTimeout(() => setMood('idle'), 5000);
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Lamma found new courses 🦙', { body: `${n} new matching programmes` });
  };

  useEffect(() => {
    load().then((m) => setMood(m.seeking ? 'search' : 'idle'));
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const startSeek = async () => {
    setMood('search');
    await fetch('/api/seek', { method: 'POST' });
    const poll = setInterval(async () => {
      const m = await load();
      if (!m.seeking) {
        clearInterval(poll);
        setMood(m.lastRun?.new_count > 0 ? 'party' : m.lastRun?.found === 0 ? 'sad' : 'idle');
        setTimeout(() => setMood('idle'), 5000);
      }
    }, 3000);
  };

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const shown = useMemo(() => {
    const q = f.q.toLowerCase();
    const out = rows.filter((r) =>
      (!q || [r.name, r.university, r.city, r.field, r.summary].some((x) => x?.toLowerCase().includes(q))) &&
      (!f.hideBlocked || r.verdict !== 'blocked') && (!f.hideAI || !r.ai_heavy) &&
      (!f.hidePassed || !r.deadline_passed) && (!f.bigCityOnly || r.big_city));
    const { key, dir } = sort;
    return out.sort((a, b) => ((a[key] ?? -1) > (b[key] ?? -1) ? 1 : -1) * dir);
  }, [rows, f, sort]);

  const patch = async (id, body) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...body } : r)));
    await fetch(`/api/programs/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  };

  const exportXlsx = async (all) => {
    const res = await fetch('/api/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: all ? [] : shown.map((r) => r.id) }) });
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: `lamma-courses-${new Date().toISOString().slice(0, 10)}.xlsx` });
    a.click(); URL.revokeObjectURL(url);
  };

  const msg = mood === 'search' ? 'Munching through the web for you…' : mood === 'party' ? 'New matches! Yay!' : mood === 'sad' ? 'Nothing found this time…'
    : meta?.lastRun ? `Last hunt: ${new Date(meta.lastRun.finished_at).toLocaleString()} · ${meta.lastRun.new_count} new` : "Ready to hunt for Fazio's Master's!";
  const demoOnly = rows.length > 0 && rows.every((r) => r.is_demo);

  return (
    <>
      <Scene mood={mood} message={msg} />
      <main>
        {(demoOnly || (meta && !meta.apiKeySet) || meta?.lastRun?.errors?.length > 0) && (
          <details className="hint"><summary>{demoOnly ? 'Showing demo data' : 'Setup needed'} · details</summary>
            {demoOnly && <p>Rows marked demo are fake. Add programme URLs to <code>data/watchlist.json</code>, then press Seek.</p>}
            {meta && !meta.apiKeySet && <p>ANTHROPIC_API_KEY is not set.</p>}
            {meta?.lastRun?.errors?.map((e, i) => <p key={i}>{e}</p>)}
          </details>
        )}

        {meta?.profile && (
          <details className="card profile" open>
            <summary>My profile &amp; credits</summary>
            <p className="facts">{[meta.profile.citizenship, `IELTS ${meta.profile.ielts}`, `German ${meta.profile.germanLevel}`, `Grade ~${meta.profile.gradeGerman}`, `${meta.profile.workExperienceYears}y work experience`, `Intake ${meta.profile.intake.join(', ')}`, `Degree ${meta.degree.units} units ≈ ${meta.degree.ectsApprox} ECTS (translator's estimate)`, `GPA ${meta.degree.gpa}/${meta.degree.gpaMax}`].join(' · ')}</p>
            <table className="credits">
              <thead><tr><th>Area</th><th>ECTS (1 unit = 1)</th><th>ECTS (1 unit = 2)</th></tr></thead>
              <tbody>{Object.entries(meta.areas).map(([k, l]) => (
                <tr key={k}><td>{l}</td><td>{meta.ects.conservative[k]}</td><td>{meta.ects.optimistic[k]}</td></tr>
              ))}</tbody>
              <tfoot><tr><td><b>Total (each course counted once)</b></td><td><b>{meta.totalUnits * meta.factors.conservative}</b></td><td><b>{meta.totalUnits * meta.factors.optimistic}</b></td></tr></tfoot>
            </table>
          </details>
        )}

        <section className="filters card">
          <input className="search" placeholder="Search…" value={f.q} onChange={(e) => set('q', e.target.value)} />
          <div className="toggles">
            {[['hideBlocked', 'Hide blocked'], ['hidePassed', 'Open deadlines'], ['hideAI', 'No AI-heavy'], ['bigCityOnly', 'Big cities']].map(([k, l]) => (
              <label key={k} className={`chip ${f[k] ? 'on' : ''}`}><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>
            ))}
          </div>
        </section>

        <div className="bar">
          <span>{shown.length} / {rows.length} programmes</span>
          <div>
            <button onClick={startSeek} disabled={mood === 'search'}>Seek now</button>
            <button onClick={() => exportXlsx(false)}>Export .xlsx</button>
            <button className="ghost" onClick={() => exportXlsx(true)}>All</button>
          </div>
        </div>

        <div className="card tablewrap">
          <table>
            <thead><tr>{COLS.map(([k, l]) => (
              <th key={k} className={k === 'deadline' ? 'deadline' : undefined} onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : -1 }))}>{l}{sort.key === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>
            ))}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <Fragment key={r.id}>
                  <tr className={`${r.deadline_passed ? 'passed' : ''} ${r.is_demo ? 'demo' : ''}`} onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <td><b>{r.name}</b> {!!r.is_new_this_week && <span className="badge new">new</span>} {!!r.is_demo && <span className="badge demo">demo</span>}</td>
                    <td>{r.university}</td>
                    <td>{r.city}{!!r.bw_tuition_warning && <span className="badge bw" title="Baden-Württemberg charges non-EU tuition">BW fee</span>}</td>
                    <td className="deadline">{r.deadline ?? '–'}{!!r.deadline_passed && ' ·passed'}</td>
                    <td>{!r.tuition_semester ? '–' : `€${r.tuition_semester}`}</td>
                    <td><Bar v={r.fit_cons} opt={r.fit_opt} /></td>
                    <td><span title={why(r)} className={`badge v-${r.verdict}`}>{VERDICT[r.verdict] ?? r.verdict}</span>{r.verdict === 'blocked' && <div className="reason">{r.blockers.join(" · ")}</div>}</td>
                    <td onClick={(e) => e.stopPropagation()}><select value={r.status} onChange={(e) => patch(r.id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                  </tr>
                  {open === r.id && (
                    <tr key={`${r.id}-d`} className="detail"><td colSpan={COLS.length}>
                      <p><b>Why “{VERDICT[r.verdict]}”?</b> {why(r)}</p>
                      <p>{r.summary}</p>
                      <p className="facts">{[r.state, r.language, r.degree, r.field, `IELTS ${r.ielts_min ?? '–'}`, `German ${r.german_req ?? '–'}`, `Software focus ${r.software_focus ?? '?'}/10`, r.ai_heavy ? 'AI-heavy' : null, r.big_city ? 'Big city' : null, `Optimistic fit ${r.fit_opt ?? '?'}%`, `Seen ${r.first_seen?.slice(0, 10)}`].filter(Boolean).join(' · ')}</p>
                      {r.blockers.length > 0 && <p className="bad">⛔ {r.blockers.join(' · ')}</p>}
                      {r.gaps.length > 0 ? <ul>{r.gaps.map((g) => <li key={g.area}>Missing in <b>{meta?.areas[g.area] ?? g.area}</b>: need {g.required} CP, you have {g.have} (short {g.missing})</li>)}</ul> : r.fit_cons != null && <p>✅ No prerequisite gaps found (conservative).</p>}
                      <textarea placeholder="Notes…" defaultValue={r.notes} onBlur={(e) => patch(r.id, { notes: e.target.value })} />
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer">Open programme page ↗</a>}
                    </td></tr>
                  )}
                </Fragment>
              ))}
              {shown.length === 0 && <tr><td colSpan={COLS.length} className="empty">Nothing matches. Loosen the filters or press Seek.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

const Bar = ({ v, opt }) => (v == null ? <span>–</span> : <div className="fit" title={`Optimistic (1 unit = 2 ECTS): ${opt}%`}><div style={{ width: `${v}%` }} className={v >= 90 ? 'hi' : v >= 60 ? 'mid' : 'lo'} /><span>{v}%</span></div>);
