#!/usr/bin/env ts-node

/**
 * Test script to validate raffle persistence functionality
 * Tests both localStorage and configuration management
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

// Mock window and localStorage for the modules
(global as any).window = { localStorage: localStorageMock };
(global as any).localStorage = localStorageMock;

// Now import the modules that depend on localStorage
import { ConfigurationManager, RaffleConfiguration } from '../src/utils/configurationManager';
import { RaffleModelType } from '../src/types/raffleModels';
import { TeamData } from '../src/types/raffle';

console.log('🧪 Starting raffle persistence validation tests...\n');

// Test 1: Load CSV data
console.log('📊 Test 1: Loading CSV data from data/raffleData.csv');
try {
  const csvPath = join(__dirname, '../data/raffleData.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value, field) => {
      if (field === 'Points' || field === 'Submissions') {
        return parseInt(value, 10);
      }
      return value;
    }
  });
  
  if (parseResult.errors.length > 0) {
    console.error('❌ CSV parsing errors:', parseResult.errors);
    process.exit(1);
  }
  
  const teams = parseResult.data as TeamData[];
  console.log(`✅ Successfully loaded ${teams.length} teams from CSV`);
  console.log(`   Sample team: ${teams[0].Team} with ${teams[0].Points} points`);
  
  // Test 2: Create and save configuration
  console.log('\n💾 Test 2: Creating and saving configuration');
  
  const configName = `Test_Configuration_${new Date().toISOString().split('T')[0]}`;
  const roundSettings = {
    numberOfRounds: 15,
    showOdds: true,
    raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
    winnersPerRound: 1,
    animationType: 'squidgame' as const
  };
  
  const testConfig = ConfigurationManager.createConfiguration(
    configName,
    teams,
    roundSettings
  );
  
  console.log(`✅ Created configuration: ${testConfig.id} - "${testConfig.name}"`);
  console.log(`   Teams: ${testConfig.teams.length}`);
  console.log(`   Rounds: ${testConfig.rounds.length}`);
  console.log(`   Model: ${testConfig.roundSettings.raffleModel}`);
  
  // Test 3: Save configuration
  console.log('\n💾 Test 3: Saving configuration to localStorage');
  ConfigurationManager.saveConfiguration(testConfig);
  
  // Test 4: Retrieve all configurations
  console.log('\n📤 Test 4: Retrieving all configurations');
  const allConfigs = ConfigurationManager.getAllConfigurations();
  console.log(`✅ Found ${allConfigs.length} configurations in storage`);
  
  allConfigs.forEach((config, index) => {
    console.log(`   ${index + 1}. ${config.id} - "${config.name}" (${config.teams.length} teams, ${config.rounds.length} rounds)`);
  });
  
  // Test 5: Retrieve specific configuration
  console.log('\n🔍 Test 5: Retrieving specific configuration by ID');
  const retrievedConfig = ConfigurationManager.getConfiguration(testConfig.id);
  
  if (retrievedConfig) {
    console.log(`✅ Successfully retrieved configuration: ${retrievedConfig.id}`);
    console.log(`   Name: ${retrievedConfig.name}`);
    console.log(`   Teams: ${retrievedConfig.teams.length}`);
    console.log(`   Rounds: ${retrievedConfig.rounds.length}`);
    console.log(`   Model: ${retrievedConfig.roundSettings.raffleModel}`);
    
    // Verify data integrity
    const teamsMatch = retrievedConfig.teams.length === testConfig.teams.length;
    const roundsMatch = retrievedConfig.rounds.length === testConfig.rounds.length;
    const nameMatches = retrievedConfig.name === testConfig.name;
    
    if (teamsMatch && roundsMatch && nameMatches) {
      console.log('✅ Data integrity verified - all fields match');
    } else {
      console.error('❌ Data integrity check failed:', {
        teamsMatch,
        roundsMatch,
        nameMatches
      });
    }
  } else {
    console.error('❌ Failed to retrieve configuration');
  }
  
  // Test 6: Test localStorage directly
  console.log('\n🗄️ Test 6: Direct localStorage inspection');
  const rawData = localStorageMock.getItem('raffle-configurations');
  if (rawData) {
    const parsed = JSON.parse(rawData);
    console.log(`✅ Raw localStorage contains ${parsed.length} configurations`);
    console.log(`   Total storage size: ${rawData.length} characters`);
    
    // Check if our test configuration is in there
    const foundOurConfig = parsed.find((c: any) => c.id === testConfig.id);
    if (foundOurConfig) {
      console.log('✅ Our test configuration is properly stored');
    } else {
      console.error('❌ Our test configuration is missing from storage');
    }
  } else {
    console.error('❌ No data found in localStorage');
  }
  
  // Test 7: Configuration with existing data matching the debug screenshot
  console.log('\n🎯 Test 7: Testing configuration from debug screenshot');
  
  // Based on the debug screenshot, there should be a configuration with ID starting with "md"
  // Let's check if there are any existing configurations
  localStorageMock.clear(); // Clear our test data first
  
  // Simulate the data from the screenshot
  const existingConfigData = {
    id: "md5hl73e8qpkeq5c5d4",
    name: "200_Realistic_Users__Progressive_Raffle_-_7/13/2025",
    teams: teams, // Use our loaded teams
    roundSettings: {
      numberOfRounds: 15,
      showOdds: true,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      winnersPerRound: 1,
      animationType: 'squidgame'
    },
    rounds: ConfigurationManager.generateOptimalRounds(teams, {
      numberOfRounds: 15,
      showOdds: true,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      winnersPerRound: 1
    }),
    createdAt: new Date('2025-07-13'),
    lastModified: new Date()
  };
  
  // Save this configuration like it would be in the browser
  localStorageMock.setItem('raffle-configurations', JSON.stringify([existingConfigData]));
  
  // Now test retrieval
  const existingConfig = ConfigurationManager.getConfiguration("md5hl73e8qpkeq5c5d4");
  if (existingConfig) {
    console.log('✅ Successfully retrieved existing configuration from debug scenario');
    console.log(`   Teams loaded: ${existingConfig.teams.length}`);
    console.log(`   Model: ${existingConfig.roundSettings.raffleModel}`);
  } else {
    console.error('❌ Failed to retrieve existing configuration from debug scenario');
  }
  
  console.log('\n🎉 All persistence tests completed!');
  
} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}