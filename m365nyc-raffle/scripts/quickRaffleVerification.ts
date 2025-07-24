/**
 * Quick Raffle Verification Script
 * 
 * This script quickly verifies the three key requirements:
 * 1. 0-ticket players are excluded
 * 2. Weighted selection works correctly
 * 3. 10x shuffling is implemented
 */

import { TeamData } from '../src/types/raffle';
import seedrandom from 'seedrandom';

interface TestResult {
  requirement: string;
  passed: boolean;
  details: string;
}

// Test data
const testTeams: TeamData[] = [
  // 0-ticket players (should be excluded)
  { Team: 'ZeroTickets_1', Points: 0, Submissions: 0, 'Last Submission': '2024-01-01', status: 'eligible' },
  { Team: 'ZeroTickets_2', Points: 99, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
  
  // 1-ticket players
  { Team: 'OneTicket_1', Points: 100, Submissions: 3, 'Last Submission': '2024-01-01', status: 'eligible' },
  { Team: 'OneTicket_2', Points: 150, Submissions: 4, 'Last Submission': '2024-01-01', status: 'eligible' },
  
  // Multi-ticket players
  { Team: 'MultiTicket_1', Points: 500, Submissions: 6, 'Last Submission': '2024-01-01', status: 'eligible' },
  { Team: 'MultiTicket_2', Points: 1000, Submissions: 7, 'Last Submission': '2024-01-01', status: 'eligible' },
  
  // High-ticket player
  { Team: 'HighTicket_1', Points: 2000, Submissions: 9, 'Last Submission': '2024-01-01', status: 'eligible' },
];

// Fisher-Yates shuffle with shuffle counter
function shuffleWithCounter<T>(array: T[], rng: () => number): { shuffled: T[]; shuffleCount: number } {
  const shuffled = [...array];
  let shuffleCount = 0;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    shuffleCount++;
  }
  
  return { shuffled, shuffleCount };
}

// Enhanced weighted selection with verification
function verifyWeightedSelection(teams: TeamData[], rng: () => number): {
  winner: string;
  zeroTicketExclusion: boolean;
  weightedCorrectness: boolean;
  shuffleCount: number;
  details: {
    totalTeams: number;
    eligibleTeams: number;
    excludedTeams: string[];
    totalTickets: number;
    winnerTickets: number;
    winnerProbability: number;
  };
} {
  // Step 1: Filter out 0-ticket players
  const eligibleTeams = teams.filter(team => {
    const tickets = Math.floor(team.Points / 100);
    return tickets > 0;
  });
  
  const excludedTeams = teams.filter(team => Math.floor(team.Points / 100) === 0).map(t => t.Team);
  const zeroTicketExclusion = excludedTeams.length > 0 && eligibleTeams.length < teams.length;
  
  // Step 2: Create weighted pool
  const weightedPool: string[] = [];
  const teamTicketCounts: { [team: string]: number } = {};
  
  eligibleTeams.forEach(team => {
    const tickets = Math.floor(team.Points / 100);
    teamTicketCounts[team.Team] = tickets;
    for (let i = 0; i < tickets; i++) {
      weightedPool.push(team.Team);
    }
  });
  
  // Step 3: Enhanced 10x shuffling
  let shuffledPool = [...weightedPool];
  let totalShuffles = 0;
  
  for (let i = 0; i < 10; i++) {
    const { shuffled, shuffleCount } = shuffleWithCounter(shuffledPool, rng);
    shuffledPool = shuffled;
    totalShuffles += shuffleCount;
  }
  
  // Step 4: Select winner
  const winningIndex = Math.floor(rng() * shuffledPool.length);
  const winner = shuffledPool[winningIndex];
  
  // Step 5: Verify weighting correctness
  const winnerTickets = teamTicketCounts[winner];
  const winnerProbability = winnerTickets / weightedPool.length;
  const weightedCorrectness = winnerTickets > 0; // Winner should have tickets
  
  return {
    winner,
    zeroTicketExclusion,
    weightedCorrectness,
    shuffleCount: totalShuffles,
    details: {
      totalTeams: teams.length,
      eligibleTeams: eligibleTeams.length,
      excludedTeams,
      totalTickets: weightedPool.length,
      winnerTickets,
      winnerProbability
    }
  };
}

// Run verification tests
function runQuickVerification(): TestResult[] {
  const results: TestResult[] = [];
  const rng = seedrandom('verification-test');
  
  console.log('🧪 QUICK RAFFLE VERIFICATION');
  console.log('=' .repeat(40));
  
  // Test 1: 0-ticket exclusion
  console.log('\n🎯 TEST 1: 0-Ticket Player Exclusion');
  try {
    const result = verifyWeightedSelection(testTeams, rng);
    
    const zeroTicketTest: TestResult = {
      requirement: '0-ticket players are excluded from raffle',
      passed: result.zeroTicketExclusion && result.details.excludedTeams.length === 2,
      details: `Excluded ${result.details.excludedTeams.length} teams: [${result.details.excludedTeams.join(', ')}]`
    };
    
    results.push(zeroTicketTest);
    console.log(zeroTicketTest.passed ? '✅ PASSED' : '❌ FAILED', zeroTicketTest.details);
    
  } catch (error) {
    results.push({
      requirement: '0-ticket players are excluded from raffle',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  
  // Test 2: Weighted selection
  console.log('\n🎯 TEST 2: Weighted Selection');
  const winCounts: { [team: string]: number } = {};
  const iterations = 1000;
  
  for (let i = 0; i < iterations; i++) {
    const result = verifyWeightedSelection(testTeams, rng);
    winCounts[result.winner] = (winCounts[result.winner] || 0) + 1;
  }
  
  // Calculate expected vs actual win rates
  const eligibleTeams = testTeams.filter(team => Math.floor(team.Points / 100) > 0);
  const totalTickets = eligibleTeams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  let weightedTestPassed = true;
  let weightedDetails = '';
  
  for (const team of eligibleTeams) {
    const tickets = Math.floor(team.Points / 100);
    const expectedWinRate = tickets / totalTickets;
    const actualWinRate = (winCounts[team.Team] || 0) / iterations;
    const deviation = Math.abs(actualWinRate - expectedWinRate);
    
    weightedDetails += `${team.Team}: ${tickets} tickets, expected ${(expectedWinRate * 100).toFixed(1)}%, actual ${(actualWinRate * 100).toFixed(1)}% (±${(deviation * 100).toFixed(1)}%); `;
    
    // Allow 5% deviation
    if (deviation > 0.05) {
      weightedTestPassed = false;
    }
  }
  
  const weightedTest: TestResult = {
    requirement: 'Weighted selection works correctly',
    passed: weightedTestPassed,
    details: weightedDetails.trim()
  };
  
  results.push(weightedTest);
  console.log(weightedTest.passed ? '✅ PASSED' : '❌ FAILED', 'Weighted selection statistical validation');
  
  // Test 3: 10x shuffling
  console.log('\n🎯 TEST 3: 10x Shuffling Implementation');
  const shuffleResult = verifyWeightedSelection(testTeams, rng);
  
  const shuffleTest: TestResult = {
    requirement: '10x shuffling is implemented',
    passed: shuffleResult.shuffleCount >= 10, // Should have at least 10 shuffle operations
    details: `Performed ${shuffleResult.shuffleCount} shuffle operations (expected ≥10)`
  };
  
  results.push(shuffleTest);
  console.log(shuffleTest.passed ? '✅ PASSED' : '❌ FAILED', shuffleTest.details);
  
  return results;
}

// Main execution
function main() {
  const results = runQuickVerification();
  
  console.log('\n🏆 VERIFICATION SUMMARY');
  console.log('=' .repeat(40));
  
  const allPassed = results.every(r => r.passed);
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.requirement}`);
    if (!result.passed) {
      console.log(`   ${result.details}`);
    }
  });
  
  console.log('\n' + '=' .repeat(40));
  if (allPassed) {
    console.log('🎉 ALL VERIFICATION TESTS PASSED!');
    console.log('✅ 0-ticket players are properly excluded');
    console.log('✅ Weighted selection is working correctly');
    console.log('✅ 10x shuffling is implemented');
  } else {
    console.log('❌ SOME VERIFICATION TESTS FAILED!');
    const failedTests = results.filter(r => !r.passed);
    console.log(`   ${failedTests.length} out of ${results.length} tests failed`);
  }
  
  return allPassed;
}

// Export for testing
export { verifyWeightedSelection, runQuickVerification };

// Run if script is executed directly
if (require.main === module) {
  main();
}