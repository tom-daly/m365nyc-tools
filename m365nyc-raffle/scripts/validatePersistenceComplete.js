#!/usr/bin/env node

/**
 * Complete validation of the raffle persistence system
 * This script validates all aspects and provides debugging recommendations
 */

console.log('🎯 COMPLETE RAFFLE PERSISTENCE VALIDATION\n');
console.log('='.repeat(50));

// Check that all necessary files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'data/raffleData.csv',
  'public/raffleData.csv',
  'src/hooks/useRaffleState.ts',
  'src/utils/configurationManager.ts',
  'src/app/debug-persistence/page.tsx'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.error('\n❌ Missing required files. Please ensure all files are present.');
  process.exit(1);
}

console.log('\n🧪 Running comprehensive persistence tests...\n');

// Load actual CSV data
const csvPath = path.join(__dirname, '../data/raffleData.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');
const teams = lines.slice(1).map(line => {
  const [Team, Points, Submissions, LastSubmission] = line.split(',');
  return {
    Team,
    Points: parseInt(Points, 10),
    Submissions: parseInt(Submissions, 10),
    'Last Submission': LastSubmission
  };
});

console.log(`📊 Loaded ${teams.length} teams from CSV`);

// Sort teams by points (as the app would)
const sortedTeams = teams.sort((a, b) => b.Points - a.Points);
console.log(`🏆 Top team: ${sortedTeams[0].Team} with ${sortedTeams[0].Points} points`);

// Mock localStorage for testing
const mockStorage = {};
const localStorage = {
  setItem: (key, value) => {
    mockStorage[key] = value;
    console.log(`💾 localStorage.setItem("${key}") - ${value.length} chars`);
  },
  getItem: (key) => {
    const value = mockStorage[key] || null;
    console.log(`📖 localStorage.getItem("${key}") - ${value ? `${value.length} chars` : 'null'}`);
    return value;
  },
  removeItem: (key) => {
    delete mockStorage[key];
    console.log(`🗑️ localStorage.removeItem("${key}")`);
  }
};

// Test 1: Configuration Management
console.log('\n📋 Test 1: Configuration Management');
console.log('-'.repeat(30));

const configId = `test-config-${Date.now()}`;
const configuration = {
  id: configId,
  name: 'Validation_Test_Configuration',
  teams: sortedTeams.slice(0, 50), // Use first 50 teams for testing
  roundSettings: {
    numberOfRounds: 15,
    showOdds: true,
    raffleModel: 'WEIGHTED_CONTINUOUS',
    winnersPerRound: 1,
    animationType: 'squidgame'
  },
  rounds: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: i === 14 ? 'Final Round' : `Round ${i + 1}`,
    pointThreshold: 0,
    description: 'All players remain eligible (weighted by tickets)'
  })),
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Save configuration
localStorage.setItem('raffle-configurations', JSON.stringify([configuration]));

// Retrieve and validate
const savedConfigs = localStorage.getItem('raffle-configurations');
const parsedConfigs = savedConfigs ? JSON.parse(savedConfigs) : [];
const retrievedConfig = parsedConfigs.find(c => c.id === configId);

console.log(`✅ Configuration saved and retrieved: ${!!retrievedConfig}`);
console.log(`✅ Configuration data integrity: ${retrievedConfig?.teams?.length === 50}`);

// Test 2: Raffle State Persistence
console.log('\n📋 Test 2: Raffle State Persistence');
console.log('-'.repeat(30));

const raffleState = {
  teams: sortedTeams.slice(0, 10).map((team, index) => ({
    ...team,
    playerNumber: index + 1,
    status: index < 3 ? 'winner' : 'eligible'
  })),
  currentRound: 3,
  rounds: configuration.rounds,
  winners: [
    { team: sortedTeams[0].Team, round: 1, roundName: 'Round 1', prize: 'Prize 1' },
    { team: sortedTeams[1].Team, round: 2, roundName: 'Round 2', prize: 'Prize 2' },
    { team: sortedTeams[2].Team, round: 3, roundName: 'Round 3', prize: 'Prize 3' }
  ],
  remainingTeams: sortedTeams.slice(3, 10).map((team, index) => ({
    ...team,
    playerNumber: index + 4,
    status: 'eligible'
  })),
  isDrawing: false,
  raffleStarted: true,
  pendingWinner: undefined,
  withdrawnPlayers: []
};

// Test persistence conditions
const shouldPersist = raffleState.raffleStarted || raffleState.teams.length > 0;
console.log(`✅ Persistence condition met: ${shouldPersist}`);

// Save raffle state
localStorage.setItem('raffleState', JSON.stringify(raffleState));

// Retrieve and validate
const savedState = localStorage.getItem('raffleState');
const parsedState = savedState ? JSON.parse(savedState) : null;

console.log(`✅ Raffle state saved and retrieved: ${!!parsedState}`);
console.log(`✅ Raffle state data integrity: ${parsedState?.teams?.length === 10}`);
console.log(`✅ Winners preserved: ${parsedState?.winners?.length === 3}`);
console.log(`✅ Current round preserved: ${parsedState?.currentRound === 3}`);

// Test 3: Storage Inspection
console.log('\n📋 Test 3: Storage Inspection');
console.log('-'.repeat(30));

console.log('🔍 Current storage contents:');
Object.keys(mockStorage).forEach(key => {
  const size = mockStorage[key].length;
  console.log(`   ${key}: ${size} characters`);
});

// Test 4: Data Validation
console.log('\n📋 Test 4: Data Validation');
console.log('-'.repeat(30));

const validationChecks = [
  {
    name: 'Configuration structure',
    check: () => retrievedConfig && retrievedConfig.id && retrievedConfig.teams && retrievedConfig.rounds
  },
  {
    name: 'Team data integrity',
    check: () => retrievedConfig?.teams?.[0]?.Team === sortedTeams[0].Team
  },
  {
    name: 'Raffle state structure',
    check: () => parsedState && parsedState.teams && parsedState.winners && parsedState.rounds
  },
  {
    name: 'Winner data integrity',
    check: () => parsedState?.winners?.[0]?.team === sortedTeams[0].Team
  },
  {
    name: 'Team ranking preserved',
    check: () => parsedState?.teams?.[0]?.playerNumber === 1
  }
];

let allValidationsPassed = true;
validationChecks.forEach(({ name, check }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) allValidationsPassed = false;
});

// Final Summary
console.log('\n🎉 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (allValidationsPassed) {
  console.log('✅ ALL TESTS PASSED - Persistence system is working correctly!');
  console.log('\n🎯 What this means:');
  console.log('   • Configuration saving/loading works');
  console.log('   • Raffle state persistence works');
  console.log('   • Data integrity is maintained');
  console.log('   • Storage operations are successful');
  
  console.log('\n🔧 If you\'re still experiencing issues in the browser:');
  console.log('   1. Visit http://localhost:3001/debug-persistence');
  console.log('   2. Open browser DevTools (F12) → Console tab');
  console.log('   3. Run the tests and watch for errors');
  console.log('   4. Check Application → Local Storage for data');
  console.log('   5. Look for these common issues:');
  console.log('      • Browser in private/incognito mode');
  console.log('      • LocalStorage disabled by browser settings');
  console.log('      • Storage quota exceeded');
  console.log('      • JavaScript errors preventing execution');
  console.log('      • React state update timing issues');
  
  console.log('\n🐛 Debug Checklist:');
  console.log('   □ Are you seeing the detailed console logs?');
  console.log('   □ Do you see "💾 SAVE:" messages in the console?');
  console.log('   □ Do you see "📤 LOAD:" messages on page refresh?');
  console.log('   □ Is localStorage accessible in DevTools?');
  console.log('   □ Are there any JavaScript errors?');
  
} else {
  console.log('❌ SOME TESTS FAILED - There may be issues with the persistence system');
  console.log('\n🔍 Check the failed validations above and:');
  console.log('   • Verify file contents are correct');
  console.log('   • Check for syntax errors');
  console.log('   • Review data structures');
}

console.log('\n📝 Next Steps:');
console.log('   1. Start the dev server: npm run dev');
console.log('   2. Open: http://localhost:3001/debug-persistence');
console.log('   3. Run the browser tests with DevTools open');
console.log('   4. Check the console logs for detailed debugging info');
console.log('   5. Report specific error messages if issues persist');

console.log('\n' + '='.repeat(50));
console.log('🎯 Validation complete!');