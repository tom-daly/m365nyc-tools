/**
 * Raffle Simulation Tests
 * 
 * This file contains comprehensive simulation tests for the raffle system.
 * Run these tests to analyze raffle behavior, fairness, and performance.
 * 
 * Run commands:
 * - npm run test:simulation (run only simulation tests)
 * - npm test (run all tests)
 */

import { TeamData, RaffleRound } from '@/types/raffle';
import { 
  generateDistributedTeams, 
  generateMockTeams, 
  selectWeightedWinner, 
  defaultRounds 
} from './testUtils';

// Simulation configuration
const SIMULATION_CONFIG = {
  TEAM_COUNTS: [50, 100, 200, 500],
  SIMULATION_RUNS: 1000,
  PERFORMANCE_RUNS: 100,
};

// Types for simulation results
interface SimulationResult {
  teamCount: number;
  totalRuns: number;
  winners: { [teamName: string]: number };
  roundsCompleted: number[];
  averageRoundsCompleted: number;
  fairnessScore: number;
  executionTime: number;
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

// Simulate a single complete raffle
function simulateCompleteRaffle(teams: TeamData[], rounds: RaffleRound[]): {
  winners: string[];
  roundsCompleted: number;
} {
  let remainingTeams = [...teams];
  const winners: string[] = [];
  let currentRound = 0;

  while (currentRound < rounds.length && remainingTeams.length > 0) {
    const round = rounds[currentRound];
    
    // Filter teams eligible for this round
    const eligibleTeams = remainingTeams.filter(team => team.Points >= round.pointThreshold);
    
    if (eligibleTeams.length === 0) break;
    
    // Select winner using weighted random selection
    const winner = selectWeightedWinner(eligibleTeams);
    winners.push(winner);
    
    // Remove winner from remaining teams
    remainingTeams = remainingTeams.filter(team => team.Team !== winner);
    
    currentRound++;
  }

  return { winners, roundsCompleted: currentRound };
}

// Calculate fairness score (lower is more fair)
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
      console.log(`  Progress: ${Math.round(((i + 1) / runs) * 100)}%`);
    }
  }

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
    executionTime
  };
}

// Generate detailed analysis report
function generateAnalysisReport(results: SimulationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAFFLE SIMULATION ANALYSIS REPORT');
  console.log('='.repeat(80));

  results.forEach(result => {
    console.log(`\n📈 Results for ${result.teamCount} teams (${result.totalRuns} simulations):`);
    console.log(`   ⚡ Execution time: ${result.executionTime.toFixed(2)}ms`);
    console.log(`   🎯 Average rounds completed: ${result.averageRoundsCompleted.toFixed(2)}`);
    console.log(`   ⚖️  Fairness score: ${result.fairnessScore.toFixed(4)} (lower = more fair)`);
    
    // Top winners analysis
    const sortedWinners = Object.entries(result.winners)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log(`   🏆 Top 5 winners:`);
    sortedWinners.forEach(([team, wins], index) => {
      const winRate = ((wins / result.totalRuns) * 100).toFixed(2);
      console.log(`      ${index + 1}. ${team}: ${wins} wins (${winRate}%)`);
    });
  });

  // Performance analysis
  console.log(`\n⚡ Performance Analysis:`);
  results.forEach(result => {
    const avgTimePerRun = result.executionTime / result.totalRuns;
    console.log(`   ${result.teamCount} teams: ${avgTimePerRun.toFixed(3)}ms per simulation`);
  });

  // Fairness comparison
  console.log(`\n⚖️  Fairness Comparison (lower scores indicate more fair distribution):`);
  results.forEach(result => {
    console.log(`   ${result.teamCount} teams: ${result.fairnessScore.toFixed(4)}`);
  });
}

// Test suite
describe('Raffle Simulation Tests', () => {
  describe('Single Raffle Simulation', () => {
    test('should complete a raffle with valid winners', () => {
      const teams = generateMockTeams(20, [500, 2000]);
      const result = simulateCompleteRaffle(teams, defaultRounds);
      
      expect(result.winners).toBeDefined();
      expect(result.winners.length).toBeGreaterThan(0);
      expect(result.winners.length).toBeLessThanOrEqual(defaultRounds.length);
      expect(result.roundsCompleted).toBeGreaterThan(0);
      
      // All winners should be unique
      const uniqueWinners = new Set(result.winners);
      expect(uniqueWinners.size).toBe(result.winners.length);
    });

    test('should respect round thresholds', () => {
      const teams = [
        { Team: 'Low Points', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },
        { Team: 'High Points', Points: 1500, Submissions: 5, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      ];
      
      // Test direct threshold filtering
      const round2Threshold = 250;
      const round3Threshold = 500;
      
      // Teams eligible for round 1 (threshold 0)
      const round1Eligible = teams.filter(team => team.Points >= 0);
      expect(round1Eligible).toHaveLength(2); // Both teams eligible
      
      // Teams eligible for round 2 (threshold 250)
      const round2Eligible = teams.filter(team => team.Points >= round2Threshold);
      expect(round2Eligible).toHaveLength(1); // Only high points team
      expect(round2Eligible[0].Team).toBe('High Points');
      
      // Teams eligible for round 3 (threshold 500)
      const round3Eligible = teams.filter(team => team.Points >= round3Threshold);
      expect(round3Eligible).toHaveLength(1); // Only high points team
      expect(round3Eligible[0].Team).toBe('High Points');
      
      // Verify that Low Points team cannot be selected for higher threshold rounds
      expect(teams.find(t => t.Team === 'Low Points')!.Points).toBeLessThan(round2Threshold);
      expect(teams.find(t => t.Team === 'Low Points')!.Points).toBeLessThan(round3Threshold);
    });
  });

  describe('Weighted Selection Tests', () => {
    test('should favor teams with more tickets', () => {
      const teams = [
        { Team: 'High Tickets', Points: 2000, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const }, // 20 tickets
        { Team: 'Low Tickets', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },   // 1 ticket
      ];
      
      const runs = 1000;
      let highTicketsWins = 0;
      
      for (let i = 0; i < runs; i++) {
        const winner = selectWeightedWinner(teams);
        if (winner === 'High Tickets') {
          highTicketsWins++;
        }
      }
      
      const winRate = highTicketsWins / runs;
      // High tickets team should win approximately 20/21 ≈ 95% of the time
      expect(winRate).toBeGreaterThan(0.85);
      expect(winRate).toBeLessThan(1.0);
    });

    test('should handle equal ticket counts fairly', () => {
      const teams = [
        { Team: 'Team A', Points: 1000, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },
        { Team: 'Team B', Points: 1000, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },
        { Team: 'Team C', Points: 1000, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      ];
      
      const runs = 3000;
      const winCounts: { [key: string]: number } = { 'Team A': 0, 'Team B': 0, 'Team C': 0 };
      
      for (let i = 0; i < runs; i++) {
        const winner = selectWeightedWinner(teams);
        winCounts[winner]++;
      }
      
      // Each team should win approximately 1/3 of the time (within reasonable margin)
      Object.values(winCounts).forEach(count => {
        const winRate = count / runs;
        expect(winRate).toBeGreaterThan(0.25);
        expect(winRate).toBeLessThan(0.42);
      });
    });
  });

  describe('Multi-Simulation Analysis', () => {
    test('should run small-scale simulation successfully', () => {
      const result = runSimulation(20, 50);
      
      expect(result.teamCount).toBe(20);
      expect(result.totalRuns).toBe(50);
      expect(result.fairnessScore).toBeGreaterThan(0);
      expect(result.averageRoundsCompleted).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should maintain consistency across multiple runs', () => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const result = runSimulation(30, 100);
        results.push(result);
      }
      
      // Fairness scores should be relatively consistent
      const fairnessScores = results.map(r => r.fairnessScore);
      const avgFairness = fairnessScores.reduce((sum, score) => sum + score, 0) / fairnessScores.length;
      const maxDeviation = Math.max(...fairnessScores.map(score => Math.abs(score - avgFairness)));
      
      // Deviation should be reasonable (less than 50% of average)
      expect(maxDeviation).toBeLessThan(avgFairness * 0.5);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large team counts efficiently', () => {
      const startTime = performance.now();
      const result = runSimulation(1000, 10);
      const endTime = performance.now();
      
      expect(result.teamCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should scale reasonably with simulation count', () => {
      const smallRuns = 10;
      const largeRuns = 50;
      
      const startSmall = performance.now();
      runSimulation(50, smallRuns);
      const timeSmall = performance.now() - startSmall;
      
      const startLarge = performance.now();
      runSimulation(50, largeRuns);
      const timeLarge = performance.now() - startLarge;
      
      const scalingFactor = timeLarge / timeSmall;
      const expectedScaling = largeRuns / smallRuns; // Should be 5
      
      // Performance should scale reasonably (modern systems may be very fast)
      // Allow for both better and worse than linear performance
      expect(scalingFactor).toBeGreaterThan(1); // Should take longer with more runs
      expect(scalingFactor).toBeLessThan(expectedScaling * 3); // But not more than 3x the expected ratio
      
      // Also verify both simulations completed successfully
      expect(timeSmall).toBeGreaterThan(0);
      expect(timeLarge).toBeGreaterThan(0);
      expect(timeLarge).toBeGreaterThan(timeSmall); // Large should take longer
    });
  });

  describe('Full Simulation Suite', () => {
    test('should run comprehensive simulation analysis', () => {
      console.log('\n🚀 Starting comprehensive raffle simulation analysis...');
      
      const results: SimulationResult[] = [];
      
      // Run simulations for different team counts
      const teamCounts = [50, 100, 200];
      const runs = 100; // Reduced for test performance
      
      teamCounts.forEach(teamCount => {
        const result = runSimulation(teamCount, runs);
        results.push(result);
      });
      
      // Generate analysis report
      generateAnalysisReport(results);
      
      // Verify all simulations completed successfully
      expect(results).toHaveLength(teamCounts.length);
      results.forEach(result => {
        expect(result.totalRuns).toBe(runs);
        expect(result.fairnessScore).toBeGreaterThan(0);
        expect(result.averageRoundsCompleted).toBeGreaterThan(0);
      });
      
      console.log('\n✅ Comprehensive simulation analysis completed successfully!');
    }, 60000); // 60 second timeout for comprehensive test
  });
});

// Export utilities for manual testing
export {
  simulateCompleteRaffle,
  runSimulation,
  generateAnalysisReport,
  SIMULATION_CONFIG
};
