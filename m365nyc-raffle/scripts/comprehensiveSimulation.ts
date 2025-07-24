/**
 * Comprehensive Raffle Simulation Suite
 * 
 * This script provides extensive testing and simulation capabilities for the raffle system.
 * It includes fairness analysis, performance testing, edge case validation, and statistical reporting.
 * 
 * Usage:
 * npx ts-node scripts/comprehensiveSimulation.ts
 */

import { TeamData, RaffleRound } from '../src/types/raffle';

// Configuration for different simulation scenarios
const SIMULATION_SCENARIOS = {
  QUICK_TEST: {
    teamCounts: [20, 50],
    runs: 100,
    name: 'Quick Test'
  },
  STANDARD_ANALYSIS: {
    teamCounts: [50, 100, 200],
    runs: 500,
    name: 'Standard Analysis'
  },
  COMPREHENSIVE_ANALYSIS: {
    teamCounts: [100, 200, 500, 1000],
    runs: 1000,
    name: 'Comprehensive Analysis'
  },
  PERFORMANCE_TEST: {
    teamCounts: [1000, 2000],
    runs: 100,
    name: 'Performance Test'
  }
};

// Default raffle rounds configuration
const defaultRounds: RaffleRound[] = [
  {
    id: 1,
    name: "Round 1",
    pointThreshold: 0,
    description: "All players eligible - First elimination round"
  },
  {
    id: 2,
    name: "Round 2", 
    pointThreshold: 250,
    description: "Players with 250+ points advance"
  },
  {
    id: 3,
    name: "Round 3",
    pointThreshold: 500,
    description: "Players with 500+ points advance"
  },
  {
    id: 4,
    name: "Round 4",
    pointThreshold: 750,
    description: "Players with 750+ points advance"
  },
  {
    id: 5,
    name: "Final Round",
    pointThreshold: 1000,
    description: "Players with 1000+ points - Weighted ticket drawing"
  }
];

// Generate teams with realistic point distribution
function generateDistributedTeams(count: number, distribution: 'uniform' | 'normal' | 'skewed' = 'normal'): TeamData[] {
  const teams: TeamData[] = [];
  
  for (let i = 1; i <= count; i++) {
    let points: number;
    
    switch (distribution) {
      case 'uniform':
        points = Math.floor(Math.random() * 2000);
        break;
      case 'skewed':
        // Most teams have low points, few have high points
        const rand = Math.random();
        if (rand < 0.7) points = Math.floor(Math.random() * 500);
        else if (rand < 0.9) points = Math.floor(Math.random() * 1000) + 500;
        else points = Math.floor(Math.random() * 1000) + 1000;
        break;
      case 'normal':
      default:
        // Bell curve distribution (mean: 1000, std: 400)
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        points = Math.max(0, Math.round(1000 + z0 * 400));
        break;
    }
    
    const submissions = Math.max(1, Math.floor(points / 200) + Math.floor(Math.random() * 3));
    
    teams.push({
      Team: `Team ${i.toString().padStart(4, '0')}`,
      Points: points,
      Submissions: submissions,
      'Last Submission': '2024-01-01',
      status: 'eligible',
    });
  }
  
  return teams.sort((a, b) => b.Points - a.Points);
}

// Weighted random selection based on tickets (Points / 100)
function selectWeightedWinner(teams: TeamData[]): string {
  if (teams.length === 0) throw new Error('No teams available for selection');
  
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  if (totalTickets === 0) {
    return teams[Math.floor(Math.random() * teams.length)].Team;
  }
  
  let randomNum = Math.floor(Math.random() * totalTickets) + 1;
  
  for (const team of teams) {
    const teamTickets = Math.floor(team.Points / 100);
    randomNum -= teamTickets;
    if (randomNum <= 0) {
      return team.Team;
    }
  }
  
  return teams[0].Team;
}

// Simulate a complete raffle
function simulateCompleteRaffle(teams: TeamData[], rounds: RaffleRound[]): {
  winners: string[];
  roundsCompleted: number;
  eliminationDetails: Array<{
    round: number;
    roundName: string;
    eligibleTeams: number;
    winner: string;
    winnerPoints: number;
    winnerTickets: number;
    eliminated: number;
  }>;
} {
  let remainingTeams = [...teams];
  const winners: string[] = [];
  const eliminationDetails: Array<{
    round: number;
    roundName: string;
    eligibleTeams: number;
    winner: string;
    winnerPoints: number;
    winnerTickets: number;
    eliminated: number;
  }> = [];
  let currentRound = 0;

  while (currentRound < rounds.length && remainingTeams.length > 0) {
    const round = rounds[currentRound];
    
    // Filter teams eligible for this round
    const eligibleTeams = remainingTeams.filter(team => team.Points >= round.pointThreshold);
    
    if (eligibleTeams.length === 0) break;
    
    // Select winner
    const winner = selectWeightedWinner(eligibleTeams);
    const winnerTeam = eligibleTeams.find(team => team.Team === winner)!;
    
    winners.push(winner);
    
    // Calculate elimination count
    const eliminatedCount = remainingTeams.filter(team => team.Points < round.pointThreshold).length;
    
    eliminationDetails.push({
      round: currentRound + 1,
      roundName: round.name,
      eligibleTeams: eligibleTeams.length,
      winner,
      winnerPoints: winnerTeam.Points,
      winnerTickets: Math.floor(winnerTeam.Points / 100),
      eliminated: eliminatedCount
    });
    
    // Remove winner from remaining teams
    remainingTeams = remainingTeams.filter(team => team.Team !== winner);
    
    currentRound++;
  }

  return { winners, roundsCompleted: currentRound, eliminationDetails };
}

// Detailed simulation results interface
interface SimulationResult {
  scenarioName: string;
  teamCount: number;
  distribution: string;
  totalRuns: number;
  winners: { [teamName: string]: number };
  roundsCompleted: number[];
  averageRoundsCompleted: number;
  fairnessScore: number;
  executionTime: number;
  detailedStats: WinnerStats[];
  performanceMetrics: {
    avgTimePerRun: number;
    minTimePerRun: number;
    maxTimePerRun: number;
  };
  edgeCases: {
    noWinners: number;
    allRoundsCompleted: number;
    singleRoundOnly: number;
  };
}

interface WinnerStats {
  teamName: string;
  points: number;
  tickets: number;
  winCount: number;
  winRate: number;
  expectedWinRate: number;
  fairnessRatio: number;
  rank: number;
}

// Calculate detailed fairness metrics
function calculateFairnessMetrics(winnerStats: WinnerStats[]): {
  fairnessScore: number;
  coefficientOfVariation: number;
  giniCoefficient: number;
} {
  // Standard deviation of win rates vs expected rates
  const deviations = winnerStats.map(stat => 
    Math.abs(stat.winRate - stat.expectedWinRate)
  );
  const fairnessScore = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
  
  // Coefficient of variation for win rates
  const winRates = winnerStats.map(stat => stat.winRate);
  const meanWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
  const variance = winRates.reduce((sum, rate) => sum + Math.pow(rate - meanWinRate, 2), 0) / winRates.length;
  const coefficientOfVariation = Math.sqrt(variance) / meanWinRate;
  
  // Gini coefficient (measure of inequality)
  const sortedWinRates = [...winRates].sort((a, b) => a - b);
  const n = sortedWinRates.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (2 * (i + 1) - n - 1) * sortedWinRates[i];
  }
  const giniCoefficient = sum / (n * meanWinRate * n);
  
  return { fairnessScore, coefficientOfVariation, giniCoefficient };
}

// Run comprehensive simulation
function runComprehensiveSimulation(
  teamCount: number, 
  runs: number, 
  distribution: 'uniform' | 'normal' | 'skewed' = 'normal',
  scenarioName: string = 'Standard'
): SimulationResult {
  console.log(`\n🎯 Running ${scenarioName} simulation: ${teamCount} teams, ${runs} runs (${distribution} distribution)`);
  
  const startTime = performance.now();
  const teams = generateDistributedTeams(teamCount, distribution);
  const winnerCounts: { [teamName: string]: number } = {};
  const roundsCompleted: number[] = [];
  const runTimes: number[] = [];
  
  let noWinners = 0;
  let allRoundsCompleted = 0;
  let singleRoundOnly = 0;
  
  // Initialize winner counts
  teams.forEach(team => {
    winnerCounts[team.Team] = 0;
  });

  // Run multiple simulations
  for (let i = 0; i < runs; i++) {
    const runStart = performance.now();
    const result = simulateCompleteRaffle(teams, defaultRounds);
    const runEnd = performance.now();
    runTimes.push(runEnd - runStart);
    
    // Count winners
    result.winners.forEach(winner => {
      winnerCounts[winner]++;
    });
    
    roundsCompleted.push(result.roundsCompleted);
    
    // Track edge cases
    if (result.winners.length === 0) noWinners++;
    if (result.roundsCompleted === defaultRounds.length) allRoundsCompleted++;
    if (result.roundsCompleted === 1) singleRoundOnly++;
    
    // Progress indicator
    if ((i + 1) % Math.max(1, Math.floor(runs / 20)) === 0) {
      console.log(`  Progress: ${Math.round(((i + 1) / runs) * 100)}%`);
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  // Calculate detailed statistics
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  const winnerStats: WinnerStats[] = teams.map((team, index) => {
    const tickets = Math.floor(team.Points / 100);
    const winCount = winnerCounts[team.Team];
    const winRate = winCount / runs;
    const expectedWinRate = totalTickets > 0 ? tickets / totalTickets : 0;
    
    return {
      teamName: team.Team,
      points: team.Points,
      tickets,
      winCount,
      winRate,
      expectedWinRate,
      fairnessRatio: expectedWinRate > 0 ? winRate / expectedWinRate : 0,
      rank: index + 1
    };
  });

  const fairnessMetrics = calculateFairnessMetrics(winnerStats);
  const averageRoundsCompleted = roundsCompleted.reduce((sum, rounds) => sum + rounds, 0) / roundsCompleted.length;

  return {
    scenarioName,
    teamCount,
    distribution,
    totalRuns: runs,
    winners: winnerCounts,
    roundsCompleted,
    averageRoundsCompleted,
    fairnessScore: fairnessMetrics.fairnessScore,
    executionTime,
    detailedStats: winnerStats,
    performanceMetrics: {
      avgTimePerRun: runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length,
      minTimePerRun: Math.min(...runTimes),
      maxTimePerRun: Math.max(...runTimes)
    },
    edgeCases: {
      noWinners,
      allRoundsCompleted,
      singleRoundOnly
    }
  };
}

// Generate comprehensive analysis report
function generateComprehensiveReport(results: SimulationResult[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('🎉 COMPREHENSIVE RAFFLE SIMULATION ANALYSIS REPORT');
  console.log('='.repeat(100));
  
  // Executive Summary
  console.log('\n📋 EXECUTIVE SUMMARY:');
  console.log(`   • Total scenarios tested: ${results.length}`);
  console.log(`   • Total simulations run: ${results.reduce((sum, r) => sum + r.totalRuns, 0).toLocaleString()}`);
  console.log(`   • Team counts tested: ${[...new Set(results.map(r => r.teamCount))].join(', ')}`);
  console.log(`   • Distributions tested: ${[...new Set(results.map(r => r.distribution))].join(', ')}`);

  results.forEach(result => {
    console.log('\n' + '-'.repeat(80));
    console.log(`📊 ${result.scenarioName.toUpperCase()} - ${result.teamCount} Teams (${result.distribution})`);
    console.log('-'.repeat(80));
    
    // Basic Statistics
    console.log(`📈 Basic Statistics:`);
    console.log(`   • Total runs: ${result.totalRuns.toLocaleString()}`);
    console.log(`   • Execution time: ${result.executionTime.toFixed(2)}ms`);
    console.log(`   • Average rounds completed: ${result.averageRoundsCompleted.toFixed(2)}`);
    console.log(`   • Fairness score: ${result.fairnessScore.toFixed(4)} (lower = more fair)`);
    
    // Performance Metrics
    console.log(`\n⚡ Performance Metrics:`);
    console.log(`   • Average time per run: ${result.performanceMetrics.avgTimePerRun.toFixed(3)}ms`);
    console.log(`   • Fastest run: ${result.performanceMetrics.minTimePerRun.toFixed(3)}ms`);
    console.log(`   • Slowest run: ${result.performanceMetrics.maxTimePerRun.toFixed(3)}ms`);
    console.log(`   • Throughput: ${(result.totalRuns / (result.executionTime / 1000)).toFixed(1)} simulations/second`);
    
    // Edge Cases
    console.log(`\n🔍 Edge Cases:`);
    console.log(`   • Simulations with no winners: ${result.edgeCases.noWinners} (${((result.edgeCases.noWinners / result.totalRuns) * 100).toFixed(2)}%)`);
    console.log(`   • Completed all rounds: ${result.edgeCases.allRoundsCompleted} (${((result.edgeCases.allRoundsCompleted / result.totalRuns) * 100).toFixed(2)}%)`);
    console.log(`   • Single round only: ${result.edgeCases.singleRoundOnly} (${((result.edgeCases.singleRoundOnly / result.totalRuns) * 100).toFixed(2)}%)`);
    
    // Top Winners Analysis
    const topWinners = result.detailedStats
      .sort((a, b) => b.winCount - a.winCount)
      .slice(0, 10);
    
    console.log(`\n🏆 Top 10 Winners:`);
    console.log(`   ${'Rank'.padEnd(6)} ${'Team'.padEnd(12)} ${'Points'.padEnd(8)} ${'Tickets'.padEnd(8)} ${'Wins'.padEnd(8)} ${'Win Rate'.padEnd(10)} ${'Expected'.padEnd(10)} ${'Fairness'.padEnd(10)}`);
    console.log(`   ${'-'.repeat(80)}`);
    
    topWinners.forEach((stat, index) => {
      const winRate = (stat.winRate * 100).toFixed(2) + '%';
      const expectedRate = (stat.expectedWinRate * 100).toFixed(2) + '%';
      const fairnessRatio = stat.fairnessRatio.toFixed(3);
      
      console.log(`   ${(index + 1).toString().padEnd(6)} ${stat.teamName.padEnd(12)} ${stat.points.toString().padEnd(8)} ${stat.tickets.toString().padEnd(8)} ${stat.winCount.toString().padEnd(8)} ${winRate.padEnd(10)} ${expectedRate.padEnd(10)} ${fairnessRatio.padEnd(10)}`);
    });
    
    // Fairness Analysis
    const unfairTeams = result.detailedStats.filter(stat => 
      stat.expectedWinRate > 0 && (stat.fairnessRatio < 0.5 || stat.fairnessRatio > 2.0)
    );
    
    if (unfairTeams.length > 0) {
      console.log(`\n⚠️  Fairness Concerns (teams with fairness ratio < 0.5 or > 2.0):`);
      unfairTeams.slice(0, 5).forEach(stat => {
        console.log(`   • ${stat.teamName}: ${stat.winCount} wins (${(stat.winRate * 100).toFixed(2)}%), expected ${(stat.expectedWinRate * 100).toFixed(2)}%, ratio: ${stat.fairnessRatio.toFixed(3)}`);
      });
    } else {
      console.log(`\n✅ Fairness Assessment: All teams within acceptable fairness range!`);
    }
  });
  
  // Cross-Scenario Analysis
  console.log('\n' + '='.repeat(80));
  console.log('🔄 CROSS-SCENARIO COMPARISON');
  console.log('='.repeat(80));
  
  console.log('\n📊 Fairness by Team Count:');
  const fairnessByTeamCount = results.reduce((acc, result) => {
    if (!acc[result.teamCount]) acc[result.teamCount] = [];
    acc[result.teamCount].push(result.fairnessScore);
    return acc;
  }, {} as { [key: number]: number[] });
  
  Object.entries(fairnessByTeamCount).forEach(([teamCount, scores]) => {
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    console.log(`   • ${teamCount} teams: ${avgScore.toFixed(4)} (avg across ${scores.length} scenario${scores.length > 1 ? 's' : ''})`);
  });
  
  console.log('\n⚡ Performance by Team Count:');
  const performanceByTeamCount = results.reduce((acc, result) => {
    if (!acc[result.teamCount]) acc[result.teamCount] = [];
    acc[result.teamCount].push(result.performanceMetrics.avgTimePerRun);
    return acc;
  }, {} as { [key: number]: number[] });
  
  Object.entries(performanceByTeamCount).forEach(([teamCount, times]) => {
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    console.log(`   • ${teamCount} teams: ${avgTime.toFixed(3)}ms per simulation (avg)`);
  });
  
  // Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  const bestFairness = Math.min(...results.map(r => r.fairnessScore));
  const bestFairnessResult = results.find(r => r.fairnessScore === bestFairness);
  
  console.log(`✅ Most Fair Configuration:`);
  console.log(`   • Scenario: ${bestFairnessResult?.scenarioName} with ${bestFairnessResult?.teamCount} teams`);
  console.log(`   • Distribution: ${bestFairnessResult?.distribution}`);
  console.log(`   • Fairness score: ${bestFairness.toFixed(4)}`);
  
  const avgPerformance = results.reduce((sum, r) => sum + r.performanceMetrics.avgTimePerRun, 0) / results.length;
  console.log(`\n⚡ Performance Summary:`);
  console.log(`   • Average simulation time: ${avgPerformance.toFixed(3)}ms`);
  console.log(`   • Recommended for real-time use: ${avgPerformance < 50 ? '✅ Yes' : '⚠️  Consider optimization'}`);
  
  const edgeCaseRate = results.reduce((sum, r) => sum + r.edgeCases.noWinners, 0) / results.reduce((sum, r) => sum + r.totalRuns, 0);
  console.log(`\n🔍 Edge Case Analysis:`);
  console.log(`   • Overall "no winners" rate: ${(edgeCaseRate * 100).toFixed(3)}%`);
  console.log(`   • System stability: ${edgeCaseRate < 0.01 ? '✅ Excellent' : edgeCaseRate < 0.05 ? '⚠️  Good' : '❌ Needs attention'}`);
  
  console.log('\n' + '='.repeat(100));
  console.log('🎯 SIMULATION COMPLETE - Analysis generated at ' + new Date().toLocaleString());
  console.log('='.repeat(100));
}

// Main execution function
async function runMainSimulation(): Promise<void> {
  console.log('🚀 Starting Comprehensive Raffle Simulation Suite...\n');
  
  const scenario = process.argv[2] || 'STANDARD_ANALYSIS';
  const config = SIMULATION_SCENARIOS[scenario as keyof typeof SIMULATION_SCENARIOS] || SIMULATION_SCENARIOS.STANDARD_ANALYSIS;
  
  console.log(`📋 Selected scenario: ${config.name}`);
  console.log(`📊 Team counts: ${config.teamCounts.join(', ')}`);
  console.log(`🔄 Runs per configuration: ${config.runs}`);
  
  const results: SimulationResult[] = [];
  
  // Test different distributions for each team count
  const distributions: Array<'uniform' | 'normal' | 'skewed'> = ['normal', 'skewed', 'uniform'];
  
  for (const teamCount of config.teamCounts) {
    for (const distribution of distributions) {
      const result = runComprehensiveSimulation(
        teamCount, 
        config.runs, 
        distribution, 
        `${config.name} (${distribution})`
      );
      results.push(result);
    }
  }
  
  // Generate comprehensive report
  generateComprehensiveReport(results);
  
  console.log('\n🎉 All simulations completed successfully!');
  console.log(`\n💡 To run different scenarios, use:`);
  console.log(`   npx ts-node scripts/comprehensiveSimulation.ts QUICK_TEST`);
  console.log(`   npx ts-node scripts/comprehensiveSimulation.ts STANDARD_ANALYSIS`);
  console.log(`   npx ts-node scripts/comprehensiveSimulation.ts COMPREHENSIVE_ANALYSIS`);
  console.log(`   npx ts-node scripts/comprehensiveSimulation.ts PERFORMANCE_TEST`);
}

// Export functions for use in other scripts or tests
module.exports = {
  generateDistributedTeams,
  selectWeightedWinner,
  simulateCompleteRaffle,
  runComprehensiveSimulation,
  generateComprehensiveReport,
  SIMULATION_SCENARIOS,
  defaultRounds
};

// Run if this script is executed directly
if (require.main === module) {
  runMainSimulation().catch(console.error);
}
