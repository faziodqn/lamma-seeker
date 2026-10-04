// Fazio's profile: transcript (per-course rows are the source of truth, printed totals are ignored)
// and hard preferences. Units are Iranian credit units.

export const PROFILE = {
  name: 'Fazio',
  citizenship: 'non-EU (Iran)',
  ielts: 6.5,
  germanLevel: 'A1',
  gradeGerman: 2.7,
  workExperienceYears: 4,
  intake: ['SS2027', 'WS2027/28'],
  maxTuitionPerYear: 4000,
  avoidCities: ['Leipzig'],
  preferredBigCities: [
    'Berlin', 'Munich', 'München', 'Hamburg', 'Cologne', 'Köln', 'Frankfurt', 'Stuttgart',
    'Düsseldorf', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nuremberg', 'Nürnberg',
    'Darmstadt', 'Karlsruhe', 'Aachen', 'Potsdam',
  ],
};

// Whole degree per the official transcript: all passed units incl. general/ethics/physics, and the sworn translator's approximate ECTS.
export const DEGREE = { units: 141, ectsApprox: 200, gpa: 15.46, gpaMax: 20 };

// 1 Iranian unit -> ECTS-equivalent. Conservative is the headline.
export const ECTS_FACTOR = { conservative: 1.0, optimistic: 2.0 };

// area keys used when comparing against admission prerequisites
export const AREAS = {
  theoretical_cs: 'Theoretical CS (automata, complexity, algorithms theory)',
  programming: 'Programming / software development',
  algorithms_ds: 'Algorithms & data structures',
  software_engineering: 'Software engineering / systems analysis',
  databases: 'Databases / information systems',
  networks_systems: 'Operating systems, networks, internet',
  security: 'IT security',
  computer_architecture: 'Computer architecture / hardware',
  mathematics: 'Mathematics (calculus, linear/discrete, statistics)',
  ai_ml: 'AI / ML / data mining',
  project: 'Project / internship',
};

// [name, units, area[]]
export const COURSES = [
  ['Computer Fundamentals and Programming', 3, ['programming']],
  ['Advanced Programming', 3, ['programming']],
  ['Data Structures', 3, ['algorithms_ds']],
  ['Algorithms Design', 3, ['algorithms_ds', 'theoretical_cs']],
  ['Digital Logic Circuits', 3, ['computer_architecture']],
  ['Computer Architecture', 3, ['computer_architecture']],
  ['Microprocessor and Assembly', 3, ['computer_architecture']],
  ['Operating Systems', 3, ['networks_systems']],
  ['Computer Networks', 3, ['networks_systems']],
  ['Database Systems', 3, ['databases']],
  ['Database System Implementation', 3, ['databases']],
  ['Artificial Intelligence and Expert Systems', 3, ['ai_ml']],
  ['Network Security', 3, ['security']],
  ['Compiler Design Principles', 3, ['theoretical_cs']],
  ['Theory of Languages and Machines', 3, ['theoretical_cs']],
  ['Programming Language Design', 3, ['programming', 'theoretical_cs']],
  ['Fundamentals of Data Mining', 3, ['ai_ml']],
  ['Systems Analysis and Design', 3, ['software_engineering']],
  ['Software Engineering', 3, ['software_engineering']],
  ['Internet Engineering', 3, ['networks_systems', 'programming']],
  ['Information Management Systems', 3, ['databases']],
  ['Information Retrieval and Web Search', 3, ['databases']],
  ['Computer-Aided Digital Systems Design', 3, ['computer_architecture']],
  ['Project', 3, ['project', 'software_engineering']],
  ['Internship', 1, ['project']],
  ['Calculus I', 3, ['mathematics']],
  ['Calculus II', 3, ['mathematics']],
  ['Discrete Mathematics', 3, ['mathematics', 'theoretical_cs']],
  ['Differential Equations', 3, ['mathematics']],
  ['Engineering Mathematics', 3, ['mathematics']],
  ['Engineering Probability and Statistics', 3, ['mathematics']],
];

// Units per area. A multi-area course counts fully toward each tagged area,
// except that theoretical_cs is only credited at half for secondary tags (see weights).
const SECONDARY_WEIGHT = 0.5;

export function unitsByArea() {
  const out = Object.fromEntries(Object.keys(AREAS).map((k) => [k, 0]));
  for (const [, units, areas] of COURSES) {
    areas.forEach((a, i) => { out[a] += units * (i === 0 ? 1 : SECONDARY_WEIGHT); });
  }
  return out;
}

export function ectsByArea(factor) {
  const u = unitsByArea();
  return Object.fromEntries(Object.entries(u).map(([k, v]) => [k, Math.round(v * factor * 10) / 10]));
}
