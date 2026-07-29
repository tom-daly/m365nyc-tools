#!/usr/bin/env node
/**
 * Converts a Goosechase participants/stats export into the CSV the raffle reads.
 *
 *   in:  Participant Name, Team Name, Points, Submissions, Last Submission, Time Joined
 *   out: Team, Points, Submissions, Last Submission
 *
 * Team Name is the key, not Participant Name. The two differ for a handful of
 * people (Maverick -> Dev, thomas daly -> Tommy Salami), and Team Name is what
 * both the photo folders and src/utils/photoUtils.ts are keyed on.
 *
 * Usage:
 *   node scripts/convertParticipants.js <participants.csv> [--out <path>] [--drop-zero]
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const Papa = require('papaparse');

const parseArgs = (argv) => {
  const args = { input: null, out: null, dropZero: false };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--out') {
      args.out = argv[i + 1];
      i += 1;
    } else if (value === '--drop-zero') {
      args.dropZero = true;
    } else if (!args.input) {
      args.input = value;
    }
  }

  return args;
};

const fail = (message) => {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    fail('Usage: node scripts/convertParticipants.js <participants.csv> [--out <path>] [--drop-zero]');
  }
  if (!fs.existsSync(args.input)) {
    fail(`Participants CSV not found: ${args.input}`);
  }

  const csv = await fsp.readFile(args.input, 'utf8');
  const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });

  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} parse warning(s); first: ${errors[0].message}`);
  }

  const headers = Object.keys(data[0] || {});
  const teamColumn = headers.includes('Team Name') ? 'Team Name' : 'Team';
  if (!headers.includes(teamColumn) || !headers.includes('Points')) {
    fail(`Unexpected columns: ${headers.join(', ')}. Expected a Team Name and Points column.`);
  }

  const seen = new Set();
  const duplicates = [];
  const zeroPoint = [];
  const rows = [];

  for (const row of data) {
    const team = (row[teamColumn] || '').trim();
    if (!team) continue;

    const points = Number(row.Points) || 0;
    const submissions = Number(row.Submissions) || 0;
    const lastSubmission = (row['Last Submission'] || '').trim();

    if (seen.has(team)) {
      duplicates.push(team);
      continue;
    }
    seen.add(team);

    if (points === 0) {
      zeroPoint.push(team);
      if (args.dropZero) continue;
    }

    // The raffle requires a non-empty Last Submission to accept the row, and a
    // participant who never submitted has none.
    rows.push({
      Team: team,
      Points: points,
      Submissions: submissions,
      'Last Submission': lastSubmission || row['Time Joined'] || new Date(0).toISOString(),
    });
  }

  if (rows.length === 0) {
    fail('No usable rows produced.');
  }

  const outputPath = args.out || path.join(process.cwd(), 'ingest', 'teams.csv');
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, Papa.unparse(rows), 'utf8');

  console.log(`✅ Wrote ${rows.length} team(s) to ${path.relative(process.cwd(), outputPath)}`);
  console.log(`   Points range: ${Math.min(...rows.map((r) => r.Points))} – ${Math.max(...rows.map((r) => r.Points))}`);

  if (zeroPoint.length > 0) {
    const action = args.dropZero ? 'dropped' : 'kept (0 tickets each)';
    console.log(`   ${zeroPoint.length} team(s) with 0 points ${action}.`);
  }
  if (duplicates.length > 0) {
    console.warn(`⚠️ Skipped ${duplicates.length} duplicate team name(s): ${duplicates.slice(0, 5).join(', ')}`);
  }
};

main().catch((error) => {
  console.error('\n❌ Conversion failed:', error);
  process.exit(1);
});
