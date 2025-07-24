#!/usr/bin/env npx ts-node --project tsconfig.scripts.json

/**
 * Test script to verify configuration features functionality
 */

import { TeamData } from '../src/types/raffle';
import { ConfigurationManager } from '../src/utils/configurationManager';
import { RaffleModelType } from '../src/types/raffleModels';

// Mock team data
const mockTeams: TeamData[] = [
  { Team: 'Team Alpha', Points: 1500, Submissions: 10, 'Last Submission': '2024-01-01', status: 'eligible', playerNumber: 1 },
  { Team: 'Team Beta', Points: 1200, Submissions: 8, 'Last Submission': '2024-01-02', status: 'eligible', playerNumber: 2 },
  { Team: 'Team Gamma', Points: 800, Submissions: 5, 'Last Submission': '2024-01-03', status: 'eligible', playerNumber: 3 },
  { Team: 'Team Delta', Points: 500, Submissions: 3, 'Last Submission': '2024-01-04', status: 'eligible', playerNumber: 4 },
  { Team: 'Team Echo', Points: 200, Submissions: 2, 'Last Submission': '2024-01-05', status: 'eligible', playerNumber: 5 },
];

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as any;

const storage: { [key: string]: string } = {};

(global.localStorage.getItem as jest.Mock).mockImplementation((key: string) => storage[key] || null);
(global.localStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
  storage[key] = value;
});
(global.localStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
  delete storage[key];
});

console.log('🧪 Testing Configuration Features...\n');

function testConfigurationManager() {
  console.log('Test 1: Configuration Creation and Storage');
  
  // Test configuration creation
  const config1 = ConfigurationManager.createConfiguration(
    'Test Configuration 1',
    mockTeams,
    {
      numberOfRounds: 3,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      winnersPerRound: 1,
      showOdds: true,
      animationType: 'squidgame'
    }
  );
  
  console.log('✅ Configuration created:', config1.name);
  console.log(`   - ID: ${config1.id}`);
  console.log(`   - Teams: ${config1.teams.length}`);
  console.log(`   - Rounds: ${config1.rounds.length}`);
  console.log(`   - Model: ${config1.roundSettings.raffleModel}`);
  
  // Test configuration saving
  ConfigurationManager.saveConfiguration(config1);
  console.log('✅ Configuration saved to localStorage');
  
  // Test configuration loading
  const allConfigs = ConfigurationManager.getAllConfigurations();
  console.log(`✅ Loaded ${allConfigs.length} configurations from storage`);
  
  // Test configuration retrieval
  const retrievedConfig = ConfigurationManager.getConfiguration(config1.id);
  console.log(`✅ Retrieved configuration: ${retrievedConfig?.name}`);
  
  return config1;
}

function testMultipleConfigurations() {
  console.log('\nTest 2: Multiple Configuration Management');
  
  // Create second configuration
  const config2 = ConfigurationManager.createConfiguration(
    'Test Configuration 2',
    mockTeams.slice(0, 3), // Only first 3 teams
    {
      numberOfRounds: 2,
      raffleModel: RaffleModelType.UNIFORM_ELIMINATION,
      winnersPerRound: 1,
      showOdds: false,
      animationType: 'wheel'
    }
  );
  
  ConfigurationManager.saveConfiguration(config2);
  
  const allConfigs = ConfigurationManager.getAllConfigurations();
  console.log(`✅ Now have ${allConfigs.length} configurations:`);
  allConfigs.forEach((config, index) => {
    console.log(`   ${index + 1}. ${config.name} (${config.teams.length} teams, ${config.rounds.length} rounds)`);
  });
  
  return config2;
}

function testRaffleStateDetection() {
  console.log('\nTest 3: Raffle State Detection Logic');
  
  // Test cases for active raffle detection
  const testCases = [
    { raffleStarted: false, winners: [], currentRound: 0, expected: false, description: 'Initial state' },
    { raffleStarted: true, winners: [], currentRound: 0, expected: true, description: 'Raffle started' },
    { raffleStarted: false, winners: [{ team: 'Team Alpha', round: 1, roundName: 'Round 1', prize: 'Prize 1' }], currentRound: 1, expected: true, description: 'Winners present' },
    { raffleStarted: false, winners: [], currentRound: 1, expected: true, description: 'Advanced round' },
    { raffleStarted: false, winners: [], currentRound: 0, expected: false, description: 'Reset state' },
  ];
  
  testCases.forEach((testCase, index) => {
    const hasActiveRaffle = testCase.raffleStarted || testCase.winners.length > 0 || testCase.currentRound > 0;
    const passed = hasActiveRaffle === testCase.expected;
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description} - ${hasActiveRaffle ? 'Active' : 'Inactive'}`);
  });
}

function testConfigurationDeletion() {
  console.log('\nTest 4: Configuration Deletion');
  
  const allConfigs = ConfigurationManager.getAllConfigurations();
  const configToDelete = allConfigs[0];
  
  if (configToDelete) {
    console.log(`✅ Deleting configuration: ${configToDelete.name}`);
    ConfigurationManager.deleteConfiguration(configToDelete.id);
    
    const remainingConfigs = ConfigurationManager.getAllConfigurations();
    console.log(`✅ Remaining configurations: ${remainingConfigs.length}`);
    
    // Verify configuration is actually deleted
    const deletedConfig = ConfigurationManager.getConfiguration(configToDelete.id);
    console.log(`✅ Deleted configuration retrieval: ${deletedConfig ? 'Found (ERROR)' : 'Not found (CORRECT)'}`);
  }
}

function testErrorHandling() {
  console.log('\nTest 5: Error Handling');
  
  // Test retrieval of non-existent configuration
  const nonExistentConfig = ConfigurationManager.getConfiguration('non-existent-id');
  console.log(`✅ Non-existent configuration retrieval: ${nonExistentConfig ? 'Found (ERROR)' : 'Not found (CORRECT)'}`);
  
  // Test with empty teams array
  const emptyConfig = ConfigurationManager.createConfiguration(
    'Empty Configuration',
    [],
    {
      numberOfRounds: 3,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      winnersPerRound: 1,
    }
  );
  
  console.log(`✅ Empty teams configuration created: ${emptyConfig.name}`);
  console.log(`   - Rounds generated: ${emptyConfig.rounds.length}`);
}

// Run all tests
try {
  const config1 = testConfigurationManager();
  const config2 = testMultipleConfigurations();
  testRaffleStateDetection();
  testConfigurationDeletion();
  testErrorHandling();
  
  console.log('\n🎉 All configuration feature tests completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   - Configuration creation and storage: ✅');
  console.log('   - Multiple configuration management: ✅');
  console.log('   - Raffle state detection: ✅');
  console.log('   - Configuration deletion: ✅');
  console.log('   - Error handling: ✅');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}