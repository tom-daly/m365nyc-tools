---
name: goosechase-refresh
description: Refresh the raffle from a new Goosechase export — drives Chrome to download the submissions zip and participants CSV from Goosechase Studio, then wipes the previous run's derived data, re-ingests photos, rebuilds avatars, and produces the raffle CSV. Use when the user wants to start a new raffle from Goosechase, re-import or reprocess an export, refresh the photos or leaderboard, or asks to "wipe and reprocess."
---

# Goosechase Refresh

Rebuilds the raffle's photo and scoring data from a fresh Goosechase export, end to end.

Run everything from `m365nyc-raffle/`. Do not run `npm run build` — per `CLAUDE.md` the user
runs builds themselves.

## Which experience

**Always ask which year before doing anything**, via AskUserQuestion. Default to the latest
(2026). Every URL below is built from the chosen ID.

| Year | Experience | ID |
|---|---|---|
| **2026** (default) | `M365 NYC Goosechase (2026)` | `2748df5d-f06f-45b9-a904-92f78b302ff5` |
| 2025 | `M365 NYC 2025 - Old` | `ebb3b3e9-ab0b-47af-ac88-9c8f0877b048` |

If the user names a year not listed, ask for its experience URL — the ID is the UUID between
`/experience/` and the next `/`, regardless of whether the link ends in `/edit`,
`/submissions`, or `/stats`.

### Pre-flight: check there is anything to export

Load `https://studio.goosechase.com/experience/<ID>/submissions` and read the header line
under "Submissions" — it reads `N total Missions  M total Submissions`.

**If M is 0, stop and tell the user.** Goosechase greys out the Download button and there is
nothing to ingest; running the pipeline would wipe good data and replace it with an empty
set. As of the last check, 2026 was LIVE with 257 missions and 0 submissions, so this is the
expected state until the event runs.

Also compare M against what is already on disk (`ls ingest/raw | wc -l`). A new export with
materially fewer participants than the current one is a red flag — surface it before wiping.

## Two inputs are required

| Input | From | Used for |
|---|---|---|
| Submissions zip (~360MB) | Review → Submissions → Download | Avatars |
| Participants CSV | Review → Stats → **Participants** → Download CSV | Tickets and odds |

The zip has no points and the CSV has no photos. Both are needed.

## Part 1 — download both files (browser)

Both downloads write files to the user's machine. **Ask once, up front, for approval to
download both**, stating the ~360MB zip size. Do not download without that approval.

Invoke the `claude-in-chrome` skill first, then load the tools in ONE ToolSearch call:

```
select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find
```

Call `tabs_context_mcp` before anything else. If it reports multiple connected browsers,
you MUST ask the user which one via AskUserQuestion — list every browser plus the option
"Open a confirmation screen in every connected Chrome extension and let me select the right
one there," which maps to `switch_browser`. Never pick one yourself.

### Step 1 — submissions zip

Navigate to:
`https://studio.goosechase.com/experience/<ID>/submissions`

Click **Download** (top right) to open the "Download submissions" modal.

The modal has a grouping dropdown, a **Start download** button, and a **Previous downloads**
table. Check the dropdown reads **"Group submissions by Team"** before proceeding — it is
often already selected, so verify rather than assume, and only open it if it says otherwise.

Grouping is not cosmetic. It decides the layout inside the zip:

| Grouping | Layout |
|---|---|
| Group by Team | `Photos & Videos/<Team>/<Mission>.jpg` |
| One Big Folder | `Photos & Videos/<Name>-<Mission>.jpg` |

`ingestGoosechaseZip.js` handles both and produces identical output, but Team grouping is
exact where flat has to infer the person/mission boundary. Prefer it.

If **Previous downloads** already lists a recent "Group by Team" entry, offer it as an
alternative — clicking its name downloads it immediately with no rebuild wait.

Downloading is two-stage:

1. Click **Start download**. The bar animates ("Shaking our tail feathers…") for roughly a
   minute. It is indeterminate — it does not track real progress.
2. When it turns green and reads **"Download ready!"**, a **Download** button replaces
   Cancel. Click that to actually transfer the file. A blank tab opens; that is normal.

### Step 2 — participants CSV

Close the modal (× top right), then click **STATS** in the left nav.

The Stats page has **four** "Download CSV" buttons — Most Popular Missions, Most Engaged
Teams, **Participants**, and Submissions. Use `find` to locate them by section heading and
click the **Participants** one. Do not click by coordinate; the page is long and the buttons
look identical.

**It must be Participants, not Submissions.** The Submissions table is one row per
submission (`Team Name, Participant Name, Mission, Type, Points`) and has no per-team
totals. Participants is what the raffle needs:

```
Participant Name, Team Name, Points, Submissions, Last Submission, Time Joined
```

Sanity-check the top row against the page before continuing — it should read
`JTP, JTP, 34400, 97`.

### Waiting for downloads

Files land in `C:\Users\thoma\Downloads`. Watch with a background Bash loop, and **filter by
modification time, not by glob alone** — stale exports with matching names are usually
already sitting in that folder and will produce an instant false positive:

```bash
MARK=/tmp/gc_mark_$$; touch "$MARK"
while :; do
  F=$(find /c/Users/thoma/Downloads -maxdepth 1 -name "*.zip" -newer "$MARK" ! -name "*.crdownload" | head -1)
  [ -n "$F" ] && { echo "READY: $F"; break; }
  sleep 3
done
```

Wait for the size to stop changing before using the file. The CSV downloads instantly and
lands as `Participants.csv`, or `Participants (N).csv` if one already exists — always take
the newest.

## Part 2 — process

The three scripts this skill owns live beside it in
`.claude/skills/goosechase-refresh/scripts/`, not in the project's `scripts/`. They are
reached through the `refresh:*` npm aliases below, so run them from `m365nyc-raffle/` —
they resolve paths from the working directory, not from their own location.

Shared tooling stays in `scripts/`: `optimizeImages.js` (step 5),
`generatePhotoCatalog.js` (build), `pruneStaticExport.js` and `deployToAzure.js` (deploy).

### 3. Wipe

```bash
npm run refresh:wipe               # report first, always
npm run refresh:wipe -- --confirm
```

Clears `public/users`, `public/photo-catalog.json`, `ingest/` scratch, `out`.

**`ingest/raw` is kept by default and that default is deliberate.** It is the
only copy of the source photos, and it has previously held people absent from a newer export.
Before ever passing `--include-raw`, dry-run the ingest and compare its selfie count
against what is already on disk. If the new export has fewer, say so and stop — do not
destroy photos to import a smaller set.

### 4. Ingest photos

```bash
npm run refresh:ingest -- "<export.zip>" --participants "<participants.csv>" --dry-run
npm run refresh:ingest -- "<export.zip>" --participants "<participants.csv>"
```

Writes `ingest/raw/<Team>/<Mission>.<ext>`.

Always pass `--participants`. It matches filenames by exact name instead of heuristics, and
normalizes Participant Name to Team Name (`Maverick` → `Dev`, `thomas daly` → `Tommy Salami`)
so photos land under the key the raffle looks up.

Dry-run first. For reference, the 2025 export yields **57 participants, 463 photos, 33
selfies**, from either grouping; 2026 has its own baseline once the event runs. Any unmatched files are listed — investigate rather than
ignore. Zero selfies means every avatar will be a dicebear fallback; stop and diagnose.

### 5. Build avatars

```bash
npm run optimize:images
```

Reads `ingest/raw/` and writes
`public/users/<Team>/{avatar,lg,sm,thumbnail}.webp`. Prefers each person's "Believe in Your
Selfie" photo (`scripts/optimizeImages.js:113`), falling back to a random dicebear thumb.
Expect roughly half to have real selfies.

### 6. Convert the participants CSV

```bash
npm run refresh:teams -- "<participants.csv>" --out ingest/teams.csv
```

Produces `Team,Points,Submissions,Last Submission`, keyed on Team Name.

Zero-point participants are kept by default and get 0 tickets (`Points ÷ 100`), so they
appear but cannot win. Pass `--drop-zero` to exclude them — ask, don't assume.

### 7. Report coverage, then hand off

Cross-check and report all four numbers explicitly:

- teams in `ingest/teams.csv` vs folders in `public/users/`
- teams with a real selfie vs a dicebear fallback
- **photo folders with no CSV row** — avatars with no ticket
- **CSV rows with no photo folder** — players with a gradient

Mismatches are normal but the user needs to see them.

Then hand back: the user runs `npm run build`, then `npm run deploy` (see `DEPLOYMENT.md`).
Uploading `ingest/teams.csv` through the app's CSV uploader is what actually starts a raffle.

## Things that will bite

- **Filenames contain characters Windows forbids.** 21 photos are under the mission
  `Fun - Where's Clippy?📎`, and `?` is illegal in Windows paths, so a bulk extract throws
  partway through. `ingestGoosechaseZip.js` streams from the zip and sanitizes destination
  names instead. Any tool that extracts to disk first will lose these.
- **Some names carry trailing whitespace** (`"Colin Britton "`, `"Mary "`) in both the CSV
  and the photo filenames. Trimming one side breaks the join.
- **`answers.xlsx` is not scoring data.** It is mission text responses
  (`Username, Mission, Answer, Timestamp, Comments`) with no points column. Irrelevant here.
- **Photos deploy publicly, by design.** `public/users/` ships to the Static Web App and is
  fetchable by anyone with the URL. That is intended — the raffle shows faces. Keeping the
  source out of git protects the repo, not the live site.
- **Nothing under `ingest/` is deployable.** Full-resolution originals live there precisely
  because it sits outside `public/`, so Next never copies them into the export. Do not move
  source photos back under `public/` — an earlier pipeline did, and it put ~340MB of
  originals one prune-step failure away from being published. `pruneStaticExport.js` still
  strips a stray `out/originals-backup` as a legacy backstop.
