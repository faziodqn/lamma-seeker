import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.LAMMA_DB || 'data/lamma.db');

db.exec(`
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,            -- source:sourceId
  source TEXT NOT NULL,
  name TEXT, university TEXT, city TEXT, state TEXT,
  degree TEXT, field TEXT, language TEXT,
  intake TEXT, deadline TEXT,
  tuition_semester REAL, contribution REAL, tuition_note TEXT,
  is_public INTEGER, accredited INTEGER,
  url TEXT,
  uni_assist INTEGER, min_grade REAL, ielts_min REAL, german_req TEXT,
  work_exp REAL, gre INTEGER,
  ai_heavy INTEGER, software_focus INTEGER,
  fit_cons INTEGER, fit_opt INTEGER, verdict TEXT,
  gaps TEXT, blockers TEXT, summary TEXT, extraction TEXT,
  content_hash TEXT,
  first_seen TEXT, last_seen TEXT,
  status TEXT DEFAULT 'new', notes TEXT DEFAULT '',
  is_demo INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT, finished_at TEXT,
  found INTEGER, new_count INTEGER, errors TEXT
);
`);
