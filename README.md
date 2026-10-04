# Lamma Course Seeker 🦙

Local app that finds German Master's programmes and scores them against Fazio's transcript (prerequisite areas, not titles).

```bash
npm run build          # build the UI
npm start              # http://localhost:4177
npm run demo           # insert fake DEMO rows (npm run demo -- --clear to remove)
npm run seek           # one seeking run now
scripts/install-timer.sh   # systemd user timer: run every 2 days
```

Setup: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.

## Data sources
- `data/watchlist.json` (works now): array of programme page URLs. Claude reads each page and extracts requirements.
- Hochschulkompass: search is behind a bot challenge, adapter stub only.
- DAAD: unreachable from the dev machine, adapter stub only.

Fit = share of required prerequisite credits covered per area. Headline uses 1 Iranian unit = 1 ECTS (conservative); optimistic uses 1:2. Edit courses/areas in `server/profile.js`.
