import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { AREAS, ECTS_FACTOR, PROFILE, ectsByArea } from './profile.js';

const GERMAN_RANK = { none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export const hashText = (t) => createHash('sha1').update(t).digest('hex');

// ---- Step 1: Claude reads the admission/curriculum text and returns structured data ----
const SYSTEM = `You extract structured facts about a German Master's programme from web page text.
Return ONLY a JSON object, no prose. Use null when the text does not say. Never guess.
Fields:
- programme_name, university, city, german_state (e.g. "Bavaria", "Baden-Württemberg"), degree (e.g. "M.Sc."), field, language_of_instruction ("English", "German", "English/German")
- prerequisites: array of {area, cp, quote}. area must be one of: ${Object.keys(AREAS).join(', ')}.
  cp = minimum credit points (ECTS) required in that area. quote = short verbatim snippet.
- min_grade_german: number or null (German scale, e.g. 2.5 means "at least 2.5")
- ielts_min: number or null
- german_required: one of none, A1, A2, B1, B2, C1, C2 or null (for admission, not for the language of instruction)
- work_experience_required_years: number or null
- gre_required: boolean or null
- uni_assist: boolean or null
- tuition_per_semester_eur: number (non-EU fee only, excluding the ~150-400 semester contribution) or null
- semester_contribution_eur: number or null
- is_public: boolean or null
- accredited: boolean or null
- deadline: ISO date string for the next application deadline for non-EU applicants, or null
- intake: array of strings like "WS2027/28", "SS2027"
- ai_heavy: boolean — true if machine learning / AI / model-training modules dominate the curriculum
- software_focus: integer 0-10, how much the curriculum is about software development / engineering
- python_ai_dominated: boolean
- summary: one sentence`;

let client;
export async function extractWithClaude(pageText, meta) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  client ??= new Anthropic();
  const res = await client.messages.create({
    model: process.env.LAMMA_MODEL || 'claude-sonnet-5-5',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Programme: ${meta.name} at ${meta.university} (${meta.city}).\n\nPAGE TEXT:\n${pageText.slice(0, 40000)}`,
    }],
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

// ---- Step 2: deterministic comparison against the transcript ----
function fitFor(prereqs, factor) {
  const have = ectsByArea(factor);
  const gaps = [];
  let total = 0, met = 0;
  for (const p of prereqs ?? []) {
    if (!p.cp || !AREAS[p.area]) continue;
    total += p.cp;
    const got = Math.min(have[p.area] ?? 0, p.cp);
    met += got;
    if (got < p.cp) gaps.push({ area: p.area, required: p.cp, have: have[p.area] ?? 0, missing: +(p.cp - got).toFixed(1) });
  }
  const score = total === 0 ? null : Math.round((met / total) * 100);
  return { score, gaps };
}

export function assess(ex) {
  const cons = fitFor(ex.prerequisites, ECTS_FACTOR.conservative);
  const opt = fitFor(ex.prerequisites, ECTS_FACTOR.optimistic);
  const blockers = [];
  if (ex.ielts_min && ex.ielts_min > PROFILE.ielts) blockers.push(`IELTS ${ex.ielts_min} needed (you have ${PROFILE.ielts})`);
  if (ex.german_required && GERMAN_RANK[ex.german_required] > GERMAN_RANK[PROFILE.germanLevel])
    blockers.push(`German ${ex.german_required} needed (you have ${PROFILE.germanLevel})`);
  if (ex.min_grade_german && PROFILE.gradeGerman > ex.min_grade_german)
    blockers.push(`Grade ${ex.min_grade_german} needed (you have ~${PROFILE.gradeGerman})`);
  if (ex.gre_required) blockers.push('GRE required');
  if (ex.work_experience_required_years && ex.work_experience_required_years > PROFILE.workExperienceYears)
    blockers.push(`${ex.work_experience_required_years}y work experience needed`);

  const noPrereqInfo = cons.score === null;
  let verdict;
  if (blockers.length) verdict = 'blocked';
  else if (noPrereqInfo) verdict = 'unknown';
  else if (cons.score >= 90) verdict = 'strong';
  else if (opt.score >= 90) verdict = 'optimistic-only';
  else if (cons.score >= 60) verdict = 'partial';
  else verdict = 'weak';

  return {
    fit_cons: cons.score, fit_opt: opt.score, verdict,
    gaps: cons.gaps, blockers,
  };
}

export function isAiHeavy(ex) {
  return Boolean(ex.ai_heavy || ex.python_ai_dominated);
}
