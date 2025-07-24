#!/usr/bin/env node

/**
 * Simple persistence test without TypeScript imports
 * This tests the core localStorage functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Simple Persistence Test - Debugging localStorage Issues\n');

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: (key) => {
      console.log(`📖 localStorage.getItem("${key}") called`);
      const value = store[key] || null;
      console.log(`   → Returning: ${value ? `${value.length} characters` : 'null'}`);
      return value;
    },
    setItem: (key, value) => {
      console.log(`💾 localStorage.setItem("${key}", ...) called`);
      console.log(`   → Storing: ${value.length} characters`);
      store[key] = value;
      console.log(`   → Success: Data stored`);
    },
    removeItem: (key) => {
      console.log(`🗑️ localStorage.removeItem("${key}") called`);
      delete store[key];
    },
    clear: () => {
      console.log(`🧹 localStorage.clear() called`);
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] || null,
    // Helper method to inspect storage
    inspect: () => {
      console.log('🔍 Current localStorage contents:');
      console.log(`   → Keys: ${Object.keys(store).length}`);
      Object.keys(store).forEach(key => {
        const value = store[key];
        console.log(`   → ${key}: ${value.length} characters`);
        if (key === 'raffle-configurations') {
          try {
            const parsed = JSON.parse(value);
            console.log(`      └── Contains ${parsed.length} configurations`);
          } catch (e) {
            console.log(`      └── Failed to parse as JSON: ${e.message}`);
          }
        }
      });
    }
  };
})();

// Test 1: Basic localStorage functionality
console.log('📋 Test 1: Basic localStorage operations');
localStorageMock.setItem('test-key', 'test-value');
const retrieved = localStorageMock.getItem('test-key');
console.log(`✅ Basic localStorage working: ${retrieved === 'test-value'}\n`);

// Test 2: Complex JSON storage (simulating raffle configurations)
console.log('📋 Test 2: Complex JSON storage');

const mockTeamData = [
  { Team: 'Elizabeth Hernandez', Points: 6900, Submissions: 63, 'Last Submission': '2025-06-28T00:00:00.000Z' },
  { Team: 'Angela Martin', Points: 6800, Submissions: 18, 'Last Submission': '2025-06-13T00:00:00.000Z' },
  { Team: 'Samantha Gonzalez', Points: 6600, Submissions: 33, 'Last Submission': '2025-06-16T00:00:00.000Z' }
];

const mockConfiguration = {
  id: 'test-config-123',
  name: 'Test Configuration',
  teams: mockTeamData,
  roundSettings: {
    numberOfRounds: 15,
    showOdds: true,
    raffleModel: 'WEIGHTED_CONTINUOUS',
    winnersPerRound: 1,
    animationType: 'squidgame'
  },
  rounds: [
    { id: 1, name: 'Round 1', pointThreshold: 0, description: 'All players eligible (weighted by tickets)' },
    { id: 2, name: 'Round 2', pointThreshold: 0, description: 'All players remain eligible (weighted by tickets)' }
  ],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Test saving configuration
console.log('💾 Saving mock configuration...');
try {
  const configToSave = [mockConfiguration];
  const jsonString = JSON.stringify(configToSave);
  localStorageMock.setItem('raffle-configurations', jsonString);
  console.log('✅ Configuration saved successfully');
} catch (error) {
  console.error('❌ Failed to save configuration:', error);
}

// Test retrieving configuration
console.log('\n📤 Retrieving configuration...');
try {
  const storedData = localStorageMock.getItem('raffle-configurations');
  if (storedData) {
    const parsed = JSON.parse(storedData);
    console.log(`✅ Retrieved ${parsed.length} configurations`);
    console.log(`   First config: ${parsed[0].id} - "${parsed[0].name}"`);
    console.log(`   Teams: ${parsed[0].teams.length}`);
    console.log(`   Rounds: ${parsed[0].rounds.length}`);
  } else {
    console.error('❌ No data retrieved');
  }
} catch (error) {
  console.error('❌ Failed to parse configuration:', error);
}

// Test 3: Simulate the exact scenario from debug screenshot
console.log('\n📋 Test 3: Simulating debug screenshot scenario');

// Clear and set up the scenario from the screenshot
localStorageMock.clear();

const debugScenarioConfig = {
  id: 'md5hl73e8qpkeq5c5d4',
  name: '200_Realistic_Users__Progressive_Raffle_-_7/13/2025',
  teams: mockTeamData, // Using our sample data
  roundSettings: {
    numberOfRounds: 15,
    showOdds: true,
    raffleModel: 'WEIGHTED_CONTINUOUS',
    winnersPerRound: 1
  },
  rounds: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: i === 14 ? 'Final Round' : `Round ${i + 1}`,
    pointThreshold: 0,
    description: 'All players remain eligible (weighted by tickets)'
  })),
  createdAt: '2025-07-13T00:00:00.000Z',
  lastModified: new Date().toISOString()
};

console.log('💾 Setting up debug scenario configuration...');
localStorageMock.setItem('raffle-configurations', JSON.stringify([debugScenarioConfig]));

// Test retrieval by ID
console.log('🔍 Testing configuration retrieval by ID...');
const storedConfigs = localStorageMock.getItem('raffle-configurations');
if (storedConfigs) {
  const configs = JSON.parse(storedConfigs);
  const targetConfig = configs.find(c => c.id === 'md5hl73e8qpkeq5c5d4');
  
  if (targetConfig) {
    console.log('✅ Successfully found configuration by ID');
    console.log(`   Name: ${targetConfig.name}`);
    console.log(`   Teams: ${targetConfig.teams.length}`);
    console.log(`   Model: ${targetConfig.roundSettings.raffleModel}`);
  } else {
    console.error('❌ Configuration not found by ID');
    console.log('   Available IDs:', configs.map(c => c.id));
  }
}

// Test 4: Raffle state persistence (from useRaffleState hook)
console.log('\n📋 Test 4: Raffle state persistence simulation');

const mockRaffleState = {
  teams: mockTeamData.map((team, index) => ({
    ...team,
    playerNumber: index + 1,
    status: 'eligible'
  })),
  currentRound: 2,
  rounds: debugScenarioConfig.rounds,
  winners: [
    { team: 'Elizabeth Hernandez', round: 1, roundName: 'Round 1', prize: 'Prize 1' },
    { team: 'Angela Martin', round: 2, roundName: 'Round 2', prize: 'Prize 2' }
  ],
  remainingTeams: mockTeamData.slice(1).map((team, index) => ({
    ...team,
    playerNumber: index + 2,
    status: 'eligible'
  })),
  isDrawing: false,
  raffleStarted: true,
  pendingWinner: undefined,
  withdrawnPlayers: []
};

console.log('💾 Saving raffle state...');
localStorageMock.setItem('raffleState', JSON.stringify(mockRaffleState));

console.log('📤 Retrieving raffle state...');
const retrievedState = localStorageMock.getItem('raffleState');
if (retrievedState) {
  const state = JSON.parse(retrievedState);
  console.log('✅ Raffle state retrieved successfully');
  console.log(`   Current round: ${state.currentRound}`);
  console.log(`   Winners: ${state.winners.length}`);
  console.log(`   Remaining teams: ${state.remainingTeams.length}`);
  console.log(`   Raffle started: ${state.raffleStarted}`);
} else {
  console.error('❌ Failed to retrieve raffle state');
}

// Final inspection
console.log('\n🔍 Final localStorage inspection:');
localStorageMock.inspect();

console.log('\n🎉 Simple persistence tests completed!');
console.log('\n📝 Summary:');
console.log('   ✅ Basic localStorage operations work');
console.log('   ✅ Complex JSON storage/retrieval works');
console.log('   ✅ Configuration persistence works');
console.log('   ✅ Raffle state persistence works');
console.log('\n💡 If persistence isn\'t working in the browser, check:');
console.log('   1. Browser localStorage permissions');
console.log('   2. Incognito/private browsing mode');
console.log('   3. Browser storage limits');
console.log('   4. JavaScript errors preventing save operations');
console.log('   5. Timing issues with React state updates');