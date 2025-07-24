/**
 * Manual Raffle Simulation Runner
 * 
 * This is a standalone script to run comprehensive raffle simulations
 * without requiring the Jest testing framework.
 * 
 * Usage:
 * - Run: npx ts-node scripts/runRaffleSimulations.ts
 * - Or compile and run with Node.js
 */

import { TeamData, RaffleRound } from '../src/types/raffle';

// Simulation configuration
const SIMULATION_CONFIG = {
  TEAM_COUNTS: [50, 100, 200, 500],
  SIMULATION_RUNS: 1000,
  PERFORMANCE_RUNS: 100,
};

// Generate mock teams with bell curve distribution
function generateDistributedTeams(count: number): TeamData[] {
  const teams: TeamData[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Generate points with bell curve distribution (mean: 1000, std: 400)
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const points = Math.max(0, Math.round(1000 + z0 * 400));
    
    // Submissions roughly correlated with points but with randomness
    const baseSubmissions = Math.floor(points / 200) + 1;
    const submissions = Math.max(1, baseSubmissions + Math.floor(Math.random() * 5) - 2);
    
    teams.push({
      Team: `Team ${i.toString().padStart(3, '0')}`,
      Points: points,
      Submissions: submissions,
      'Last Submission': '2024-01-01',
      status: 'eligible',
    });
  }
  
  return teams.sort((a, b) => b.Points - a.Points);
}

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

// Weighted random selection
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
    eliminationDetails.push({
      round: currentRound + 1,
      roundName: round.name,
      eligibleTeams: eligibleTeams.length,
      winner,
      winnerPoints: winnerTeam.Points,
      winnerTickets: Math.floor(winnerTeam.Points / 100)
    });
    
    // Remove winner from remaining teams
    remainingTeams = remainingTeams.filter(team => team.Team !== winner);
    
    currentRound++;
  }

  return { winners, roundsCompleted: currentRound, eliminationDetails };
}

// Types for simulation results
interface SimulationResult {
  teamCount: number;
  totalRuns: number;
  winners: { [teamName: string]: number };
  roundsCompleted: number[];
  averageRoundsCompleted: number;
  fairnessScore: number;
  executionTime: number;
  detailedStats: WinnerStats[];
}

interface WinnerStats {
  teamName: string;
  points: number;
  tickets: number;
  winCount: number;
  winRate: number;
  expectedWinRate: number;
  fairnessRatio: number;
}

// Calculate fairness score
function calculateFairnessScore(winnerStats: WinnerStats[]): number {
  const deviations = winnerStats.map(stat => 
    Math.abs(stat.winRate - stat.expectedWinRate)
  );
  return deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
}

// Run simulation for a specific team count
function runSimulation(teamCount: number, runs: number): SimulationResult {
  console.log(`\n🎯 Running simulation with ${teamCount} teams (${runs} runs)...`);
  
  const startTime = performance.now();
  const teams = generateDistributedTeams(teamCount);
  const winnerCounts: { [teamName: string]: number } = {};
  const roundsCompleted: number[] = [];
  
  // Initialize winner counts
  teams.forEach(team => {
    winnerCounts[team.Team] = 0;
  });

  // Run multiple simulations
  for (let i = 0; i < runs; i++) {
    const result = simulateCompleteRaffle(teams, defaultRounds);
    
    // Count winners
    result.winners.forEach(winner => {
      winnerCounts[winner]++;
    });
    
    roundsCompleted.push(result.roundsCompleted);
    
    // Progress indicator
    if ((i + 1) % Math.max(1, Math.floor(runs / 10)) === 0) {
      const percentage = Math.round(((i + 1) / runs) * 100);
      process.stdout.write(`\r  Progress: ${percentage}% ${'█'.repeat(Math.floor(percentage / 5))}${'░'.repeat(20 - Math.floor(percentage / 5))}`);
    }
  }
  
  console.log(''); // New line after progress bar

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  // Calculate statistics
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  const winnerStats: WinnerStats[] = teams.map(team => {
    const tickets = Math.floor(team.Points / 100);
    const winCount = winnerCounts[team.Team];
    const winRate = winCount / runs;
    const expectedWinRate = tickets / totalTickets;
    
    return {
      teamName: team.Team,
      points: team.Points,
      tickets,
      winCount,
      winRate,
      expectedWinRate,
      fairnessRatio: expectedWinRate > 0 ? winRate / expectedWinRate : 0
    };
  });

  const fairnessScore = calculateFairnessScore(winnerStats);
  const averageRoundsCompleted = roundsCompleted.reduce((sum, rounds) => sum + rounds, 0) / roundsCompleted.length;

  return {
    teamCount,
    totalRuns: runs,
    winners: winnerCounts,
    roundsCompleted,
    averageRoundsCompleted,
    fairnessScore,
    executionTime,
    detailedStats: winnerStats
  };
}

// Generate detailed analysis report
function generateAnalysisReport(results: SimulationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE RAFFLE SIMULATION ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toLocaleString()}`);
  console.log(`Total simulations run: ${results.reduce((sum, r) => sum + r.totalRuns, 0)}`);

  results.forEach((result, index) => {
    console.log(`\n${'▓'.repeat(60)}`);
    console.log(`📈 ANALYSIS ${index + 1}: ${result.teamCount} teams (${result.totalRuns} simulations)`);
    console.log(`${'▓'.repeat(60)}`);
    
    console.log(`\n⚡ Performance Metrics:`);
    console.log(`   • Total execution time: ${result.executionTime.toFixed(2)}ms`);
    console.log(`   • Average time per simulation: ${(result.executionTime / result.totalRuns).toFixed(3)}ms`);
    console.log(`   • Simulations per second: ${(result.totalRuns / (result.executionTime / 1000)).toFixed(1)}`);
    
    console.log(`\n🎯 Raffle Metrics:`);
    console.log(`   • Average rounds completed: ${result.averageRoundsCompleted.toFixed(2)}`);
    console.log(`   • Fairness score: ${result.fairnessScore.toFixed(4)} (lower = more fair)`);
    
    // Round completion distribution
    const roundDistribution: { [key: number]: number } = {};
    result.roundsCompleted.forEach(rounds => {
      roundDistribution[rounds] = (roundDistribution[rounds] || 0) + 1;
    });
    
    console.log(`\n🔄 Round Completion Distribution:`);
    Object.entries(roundDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([rounds, count]) => {
        const percentage = ((count / result.totalRuns) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(parseInt(percentage) / 2));
        console.log(`   • ${rounds} rounds: ${count} times (${percentage}%) ${bar}`);
      });
    
    // Top winners analysis
    const sortedWinners = result.detailedStats
      .sort((a, b) => b.winCount - a.winCount)
      .slice(0, 10);
    
    console.log(`\n🏆 Top 10 Winners:`);
    console.log(`   ${'Rank'.padEnd(6)} ${'Team'.padEnd(15)} ${'Wins'.padEnd(8)} ${'Rate'.padEnd(8)} ${'Points'.padEnd(8)} ${'Tickets'.padEnd(8)} ${'Fairness'.padEnd(8)}`);
    console.log(`   ${'-'.repeat(70)}`);
    
    sortedWinners.forEach((winner, index) => {
      const rank = `#${index + 1}`;
      const winRate = (winner.winRate * 100).toFixed(1) + '%';
      const fairness = winner.fairnessRatio.toFixed(2);
      
      console.log(`   ${rank.padEnd(6)} ${winner.teamName.padEnd(15)} ${winner.winCount.toString().padEnd(8)} ${winRate.padEnd(8)} ${winner.points.toString().padEnd(8)} ${winner.tickets.toString().padEnd(8)} ${fairness.padEnd(8)}`);
    });
    
    // Fairness analysis
    const topTeamsByTickets = result.detailedStats
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5);
    
    console.log(`\n⚖️  Fairness Analysis (Top 5 by Tickets):`);
    console.log(`   Expected vs Actual Win Rates:`);
    topTeamsByTickets.forEach(team => {
      const expected = (team.expectedWinRate * 100).toFixed(1);
      const actual = (team.winRate * 100).toFixed(1);
      const difference = ((team.winRate - team.expectedWinRate) * 100).toFixed(1);
      const sign = parseFloat(difference) >= 0 ? '+' : '';
      console.log(`   • ${team.teamName}: Expected ${expected}%, Actual ${actual}% (${sign}${difference}%)`);
    });
  });

  // Cross-analysis
  console.log(`\n${'▓'.repeat(60)}`);
  console.log(`🔍 CROSS-ANALYSIS`);
  console.log(`${'▓'.repeat(60)}`);
  
  console.log(`\n⚡ Performance Scaling:`);
  results.forEach((result, index) => {
    const avgTimePerRun = result.executionTime / result.totalRuns;
    const simsPerSecond = result.totalRuns / (result.executionTime / 1000);
    console.log(`   • ${result.teamCount.toString().padEnd(4)} teams: ${avgTimePerRun.toFixed(3)}ms/sim, ${simsPerSecond.toFixed(1)} sims/sec`);
  });

  console.log(`\n⚖️  Fairness Comparison:`);
  const sortedByFairness = [...results].sort((a, b) => a.fairnessScore - b.fairnessScore);
  sortedByFairness.forEach(result => {
    const rating = result.fairnessScore < 0.01 ? 'EXCELLENT' : 
                   result.fairnessScore < 0.02 ? 'GOOD' : 
                   result.fairnessScore < 0.05 ? 'FAIR' : 'NEEDS IMPROVEMENT';
    console.log(`   • ${result.teamCount.toString().padEnd(4)} teams: ${result.fairnessScore.toFixed(4)} (${rating})`);
  });

  console.log(`\n✅ Analysis complete! Check the detailed metrics above for insights.`);
  console.log('='.repeat(80));
}

// Demo single raffle simulation
function demoSingleRaffle(): void {
  console.log('\n🎮 DEMO: Single Raffle Simulation');
  console.log('='.repeat(50));
  
  const teams = generateDistributedTeams(20);
  console.log(`\n📋 Generated ${teams.length} teams with varied point distributions`);
  
  // Show team distribution
  console.log('\n🏁 Team Overview (Top 10):');
  teams.slice(0, 10).forEach((team, index) => {
    const tickets = Math.floor(team.Points / 100);
    console.log(`   ${(index + 1).toString().padStart(2)}. ${team.Team}: ${team.Points} points (${tickets} tickets)`);
  });
  
  const result = simulateCompleteRaffle(teams, defaultRounds);
  
  console.log(`\n🎯 Raffle Results:`);
  console.log(`   • Rounds completed: ${result.roundsCompleted}`);
  console.log(`   • Total winners: ${result.winners.length}`);
  
  console.log(`\n🏆 Round-by-Round Results:`);
  result.eliminationDetails.forEach((detail, index) => {
    console.log(`   Round ${detail.round} (${detail.roundName}):`);
    console.log(`     • Eligible teams: ${detail.eligibleTeams}`);
    console.log(`     • Winner: ${detail.winner} (${detail.winnerPoints} points, ${detail.winnerTickets} tickets)`);
  });
}

// Main execution function
async function runFullAnalysis(): Promise<void> {
  console.log('🚀 Starting Comprehensive Raffle Simulation Analysis...\n');
  
  // Demo single raffle
  demoSingleRaffle();
  
  // Full simulation analysis
  const results: SimulationResult[] = [];
  
  for (const teamCount of SIMULATION_CONFIG.TEAM_COUNTS) {
    const runs = teamCount <= 100 ? SIMULATION_CONFIG.SIMULATION_RUNS : SIMULATION_CONFIG.PERFORMANCE_RUNS;
    const result = runSimulation(teamCount, runs);
    results.push(result);
  }
  
  // Generate comprehensive report
  generateAnalysisReport(results);
  
  console.log('\n🎉 All simulations completed successfully!');
  console.log('💡 Use this data to analyze raffle fairness, performance, and behavior patterns.');
}

// Export for use in other scripts
export {
  runSimulation,
  simulateCompleteRaffle,
  generateAnalysisReport,
  generateDistributedTeams,
  selectWeightedWinner,
  demoSingleRaffle,
  SIMULATION_CONFIG
};

// Run if called directly
if (require.main === module) {
  runFullAnalysis().catch(console.error);
}
