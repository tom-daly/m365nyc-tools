#!/usr/bin/env node

/**
 * Script to convert Session Feedback.csv to raffle format
 *
 * Reads Session Feedback.csv and creates a new CSV with:
 * - Team: Rater Name (deduplicated)
 * - Points: 100 (default)
 * - Submissions: 1
 * - Last Submission: Today's date in ISO format
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const INPUT_FILE = path.join(__dirname, '../data/feedback.csv');
const OUTPUT_FILE = path.join(__dirname, '../data/Session_Feedback_Raffle.csv');

console.log('🎯 Converting Session Feedback to Raffle Format\n');

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

let csvData;
try {
  csvData = fs.readFileSync(INPUT_FILE, 'utf8');
} catch (err) {
  console.error(`❌ Failed to read ${INPUT_FILE}:`, err.message);
  process.exit(1);
}

// Papa.parse's `error` callback only fires in step/streaming mode, so for a
// full-string parse we have to inspect results.errors ourselves.
const results = Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
});

if (results.errors && results.errors.length) {
  console.error('❌ CSV parse errors:');
  results.errors.forEach(e => console.error(`  - row ${e.row}: ${e.message}`));
  process.exit(1);
}

console.log(`📄 Read ${results.data.length} feedback entries`);

// Sets preserve insertion order in JS, so iterating the Set already gives us
// "first seen" order — no separate map or sort needed.
const uniqueRaters = new Set();
results.data.forEach(row => {
  const raterName = row['Rater Name']?.trim();
  if (raterName) {
    uniqueRaters.add(raterName);
  }
});

console.log(`👥 Found ${uniqueRaters.size} unique raters\n`);

const today = new Date().toISOString();

const raffleData = Array.from(uniqueRaters).map(raterName => ({
  Team: raterName,
  Points: 100,
  Submissions: 1,
  'Last Submission': today,
}));

const csv = Papa.unparse(raffleData, {
  header: true,
  columns: ['Team', 'Points', 'Submissions', 'Last Submission'],
});

try {
  fs.writeFileSync(OUTPUT_FILE, csv, 'utf8');
} catch (err) {
  console.error(`❌ Failed to write ${OUTPUT_FILE}:`, err.message);
  process.exit(1);
}

console.log('✅ Conversion complete!');
console.log(`📊 Output: ${OUTPUT_FILE}`);
console.log(`👥 Total participants: ${raffleData.length}`);
console.log(`📅 Last Submission date: ${today}\n`);

console.log('Preview of first 5 entries:');
console.table(raffleData.slice(0, 5));

console.log('\n🎉 Ready to upload to the raffle system!');
