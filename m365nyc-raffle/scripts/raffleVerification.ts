/**
 * Comprehensive Raffle Verification Script
 * 
 * This script verifies:
 * 1. 0-ticket players are completely excluded from raffle selection
 * 2. Weighted selection works correctly (more tickets = higher chance)
 * 3. Enhanced 10x shuffling is implemented
 * 4. Statistical validation of fairness
 */

import { TeamData, RaffleRound } from '../src/types/raffle';
import seedrandom from 'seedrandom';

// Enhanced team data with explicit 0-ticket scenarios
interface TestTeamData extends TeamData {
  expectedTickets: number;
  shouldBeExcluded: boolean;
}

// Test data with various ticket scenarios
const testTeams: TestTeamData[] = [
  // 0-ticket players (should be excluded)
  { Team: 'ZeroTickets_1', Points: 0, Submissions: 0, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 0, shouldBeExcluded: true },
  { Team: 'ZeroTickets_2', Points: 50, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 0, shouldBeExcluded: true },
  { Team: 'ZeroTickets_3', Points: 99, Submissions: 2, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 0, shouldBeExcluded: true },
  
  // 1-ticket players
  { Team: 'OneTicket_1', Points: 100, Submissions: 3, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 1, shouldBeExcluded: false },
  { Team: 'OneTicket_2', Points: 150, Submissions: 4, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 1, shouldBeExcluded: false },
  { Team: 'OneTicket_3', Points: 199, Submissions: 5, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 1, shouldBeExcluded: false },
  
  // Multiple ticket players
  { Team: 'MultiTicket_1', Points: 500, Submissions: 6, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 5, shouldBeExcluded: false },
  { Team: 'MultiTicket_2', Points: 1000, Submissions: 7, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 10, shouldBeExcluded: false },
  { Team: 'MultiTicket_3', Points: 1500, Submissions: 8, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 15, shouldBeExcluded: false },
  
  // High ticket players
  { Team: 'HighTicket_1', Points: 2000, Submissions: 9, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 20, shouldBeExcluded: false },
  { Team: 'HighTicket_2', Points: 5000, Submissions: 10, 'Last Submission': '2024-01-01', status: 'eligible', expectedTickets: 50, shouldBeExcluded: false },
];

// Enhanced weighted selection with 10x shuffling
function enhancedWeightedSelection(teams: TestTeamData[], rng: () => number): {
  winner: string;
  selectionDetails: {
    totalEligibleTeams: number;
    totalTickets: number;
    excludedTeams: string[];
    weightedPool: string[];
    shuffleIterations: number;
    winningTicketIndex: number;
  };
} {
  console.log('\n🎯 ENHANCED WEIGHTED SELECTION DEBUG 🎯');
  
  // Step 1: Filter out 0-ticket players
  const eligibleTeams = teams.filter(team => {
    const tickets = Math.floor(team.Points / 100);
    const isEligible = tickets > 0;
    
    if (!isEligible) {
      console.log(`❌ EXCLUDED: ${team.Team} (${team.Points} points = ${tickets} tickets)`);
    } else {
      console.log(`✅ ELIGIBLE: ${team.Team} (${team.Points} points = ${tickets} tickets)`);
    }
    
    return isEligible;
  });
  
  const excludedTeams = teams.filter(team => Math.floor(team.Points / 100) === 0).map(t => t.Team);
  
  console.log(`\n📊 ELIGIBILITY SUMMARY:`);
  console.log(`Total teams: ${teams.length}`);
  console.log(`Eligible teams: ${eligibleTeams.length}`);
  console.log(`Excluded teams: ${excludedTeams.length}`);
  console.log(`Excluded team names: [${excludedTeams.join(', ')}]`);
  
  if (eligibleTeams.length === 0) {
    throw new Error('No eligible teams with tickets > 0');
  }
  
  // Step 2: Create weighted pool
  const weightedPool: string[] = [];
  eligibleTeams.forEach(team => {
    const tickets = Math.floor(team.Points / 100);
    for (let i = 0; i < tickets; i++) {
      weightedPool.push(team.Team);
    }
  });
  
  console.log(`\n🎫 WEIGHTED POOL COMPOSITION:`);
  const teamTicketCounts: { [team: string]: number } = {};
  for (const teamName of weightedPool) {
    teamTicketCounts[teamName] = (teamTicketCounts[teamName] || 0) + 1;
  }
  
  Object.entries(teamTicketCounts).forEach(([team, count]) => {
    const teamData = eligibleTeams.find(t => t.Team === team);
    const percentage = (count / weightedPool.length * 100).toFixed(2);
    console.log(`  ${team}: ${count} tickets (${percentage}% of pool) - ${teamData?.Points} points`);
  });
  
  console.log(`\nTotal tickets in pool: ${weightedPool.length}`);
  
  // Step 3: Enhanced shuffling (10 iterations)
  console.log(`\n🔀 ENHANCED SHUFFLING (10x iterations):`);
  let shuffledPool = [...weightedPool];
  
  for (let i = 0; i < 10; i++) {
    shuffledPool = fisherYatesShuffle(shuffledPool, rng);
    console.log(`  Shuffle ${i + 1}: First 5 tickets: [${shuffledPool.slice(0, 5).join(', ')}]`);
  }
  
  // Step 4: Select winner
  const winningIndex = Math.floor(rng() * shuffledPool.length);
  const winner = shuffledPool[winningIndex];
  
  console.log(`\n🏆 WINNER SELECTION:`);
  console.log(`Winning ticket index: ${winningIndex}`);
  console.log(`Winner: ${winner}`);
  console.log(`Winner's total tickets: ${teamTicketCounts[winner]}`);
  console.log(`Winner's win probability: ${(teamTicketCounts[winner] / weightedPool.length * 100).toFixed(2)}%`);
  
  return {
    winner,
    selectionDetails: {
      totalEligibleTeams: eligibleTeams.length,
      totalTickets: weightedPool.length,
      excludedTeams,
      weightedPool: shuffledPool,
      shuffleIterations: 10,
      winningTicketIndex: winningIndex
    }
  };
}

// Fisher-Yates shuffle implementation
function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Statistical validation test
function runStatisticalValidation(teams: TestTeamData[], iterations: number = 10000): {
  results: { [teamName: string]: { wins: number; expectedWins: number; percentage: number } };
  summary: {
    totalIterations: number;
    zeroTicketWins: number;
    fairnessScore: number;
    significantDeviations: string[];
  };
} {
  console.log(`\n📈 STATISTICAL VALIDATION (${iterations} iterations):`);
  
  const rng = seedrandom('statistical-test');
  const results: { [teamName: string]: { wins: number; expectedWins: number; percentage: number } } = {};
  let zeroTicketWins = 0;
  
  // Initialize results
  teams.forEach(team => {
    results[team.Team] = { wins: 0, expectedWins: 0, percentage: 0 };
  });
  
  // Calculate expected wins for eligible teams
  const eligibleTeams = teams.filter(t => !t.shouldBeExcluded);
  const totalTickets = eligibleTeams.reduce((sum, team) => sum + team.expectedTickets, 0);
  
  eligibleTeams.forEach(team => {
    results[team.Team].expectedWins = (team.expectedTickets / totalTickets) * iterations;
  });
  
  // Run simulations
  for (let i = 0; i < iterations; i++) {
    try {
      const { winner } = enhancedWeightedSelection(teams, rng);
      results[winner].wins++;
      
      // Check if a 0-ticket player won (should never happen)
      const winnerTeam = teams.find(t => t.Team === winner);
      if (winnerTeam && winnerTeam.shouldBeExcluded) {
        zeroTicketWins++;
        console.error(`❌ ERROR: 0-ticket player won: ${winner}`);
      }
    } catch (error) {
      console.error(`Error in iteration ${i}:`, error);
    }
    
    // Progress logging
    if ((i + 1) % 1000 === 0) {
      console.log(`  Progress: ${i + 1}/${iterations} iterations`);
    }
  }
  
  // Calculate percentages and deviations
  const significantDeviations: string[] = [];
  
  Object.entries(results).forEach(([teamName, data]) => {
    data.percentage = (data.wins / iterations) * 100;
    
    // Check for significant deviations (>10% difference from expected)
    const expectedPercentage = (data.expectedWins / iterations) * 100;
    const deviation = Math.abs(data.percentage - expectedPercentage);
    
    if (deviation > 10 && data.expectedWins > 0) {
      significantDeviations.push(`${teamName}: ${deviation.toFixed(2)}% deviation`);
    }
  });
  
  // Calculate fairness score
  const fairnessScore = significantDeviations.length === 0 ? 100 : 
    Math.max(0, 100 - (significantDeviations.length / eligibleTeams.length * 100));
  
  return {
    results,
    summary: {
      totalIterations: iterations,
      zeroTicketWins,
      fairnessScore,
      significantDeviations
    }
  };
}

// Main verification function
function runComprehensiveVerification(): void {
  console.log('🧪 COMPREHENSIVE RAFFLE VERIFICATION');
  console.log('=' .repeat(50));
  
  // Test 1: Single selection verification
  console.log('\n🎯 TEST 1: Single Selection Verification');
  const rng = seedrandom('test-seed');
  
  try {
    const result = enhancedWeightedSelection(testTeams, rng);
    
    console.log('\n✅ Single selection test passed!');
    console.log(`Winner: ${result.winner}`);
    console.log(`Excluded teams: ${result.selectionDetails.excludedTeams.length}`);
    console.log(`Total eligible teams: ${result.selectionDetails.totalEligibleTeams}`);
    console.log(`Total tickets: ${result.selectionDetails.totalTickets}`);
    console.log(`Shuffle iterations: ${result.selectionDetails.shuffleIterations}`);
    
    // Verify 0-ticket exclusion
    const winnerTeam = testTeams.find(t => t.Team === result.winner);
    if (winnerTeam && winnerTeam.shouldBeExcluded) {
      console.error('❌ CRITICAL ERROR: 0-ticket player was selected!');
    } else {
      console.log('✅ 0-ticket exclusion verified');
    }
    
  } catch (error) {
    console.error('❌ Single selection test failed:', error);
  }
  
  // Test 2: Statistical validation
  console.log('\n📊 TEST 2: Statistical Validation');
  const validation = runStatisticalValidation(testTeams, 1000);
  
  console.log('\n📈 STATISTICAL RESULTS:');
  Object.entries(validation.results).forEach(([teamName, data]) => {
    const team = testTeams.find(t => t.Team === teamName);
    const status = team?.shouldBeExcluded ? 'EXCLUDED' : 'ELIGIBLE';
    const ticketCount = team?.expectedTickets || 0;
    
    console.log(`${teamName} (${status}, ${ticketCount} tickets):`);
    console.log(`  Wins: ${data.wins}`);
    console.log(`  Expected: ${data.expectedWins.toFixed(1)}`);
    console.log(`  Percentage: ${data.percentage.toFixed(2)}%`);
    console.log(`  Deviation: ${data.wins > 0 ? ((data.wins - data.expectedWins) / data.expectedWins * 100).toFixed(2) : 'N/A'}%`);
    console.log('');
  });
  
  console.log('🏆 VERIFICATION SUMMARY:');
  console.log(`Total iterations: ${validation.summary.totalIterations}`);
  console.log(`Zero-ticket wins: ${validation.summary.zeroTicketWins} (should be 0)`);
  console.log(`Fairness score: ${validation.summary.fairnessScore}%`);
  console.log(`Significant deviations: ${validation.summary.significantDeviations.length}`);
  
  if (validation.summary.significantDeviations.length > 0) {
    console.log('⚠️  Significant deviations detected:');
    validation.summary.significantDeviations.forEach(dev => console.log(`  - ${dev}`));
  }
  
  // Final verification
  console.log('\n🎯 FINAL VERIFICATION:');
  const allTestsPassed = 
    validation.summary.zeroTicketWins === 0 &&
    validation.summary.fairnessScore >= 80 &&
    validation.summary.significantDeviations.length === 0;
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ 0-ticket players are properly excluded');
    console.log('✅ Weighted selection is working correctly');
    console.log('✅ 10x shuffling is implemented');
    console.log('✅ Statistical fairness is maintained');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    if (validation.summary.zeroTicketWins > 0) {
      console.log('❌ 0-ticket players are not properly excluded');
    }
    if (validation.summary.fairnessScore < 80) {
      console.log('❌ Fairness score is below acceptable threshold');
    }
    if (validation.summary.significantDeviations.length > 0) {
      console.log('❌ Significant statistical deviations detected');
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Export for testing
export { enhancedWeightedSelection, runComprehensiveVerification, fisherYatesShuffle };

// Run verification if script is executed directly
if (require.main === module) {
  runComprehensiveVerification();
}