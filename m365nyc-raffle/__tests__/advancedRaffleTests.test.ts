/**
 * Advanced Raffle Testing Suite
 * 
 * This file contains comprehensive tests for edge cases, stress testing,
 * and validation of the raffle system's behavior under various conditions.
 */

import { TeamData } from '@/types/raffle';
import { 
  generateDistributedTeams, 
  selectWeightedWinner, 
  simulateCompleteRaffle,
  runComprehensiveSimulation,
  defaultRounds 
} from '../scripts/comprehensiveSimulation';

describe('Advanced Raffle Testing Suite', () => {
  
  describe('Edge Case Validation', () => {
    test('should handle empty team list gracefully', () => {
      expect(() => selectWeightedWinner([])).toThrow('No teams available for selection');
    });

    test('should handle teams with zero points', () => {
      const teams: TeamData[] = [
        { Team: 'Zero Points', Points: 0, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Some Points', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      // Should still be able to select a winner
      const winner = selectWeightedWinner(teams);
      expect(['Zero Points', 'Some Points']).toContain(winner);
    });

    test('should handle all teams with zero points', () => {
      const teams: TeamData[] = [
        { Team: 'Team A', Points: 0, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Team B', Points: 0, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      // Should fall back to random selection
      const winner = selectWeightedWinner(teams);
      expect(['Team A', 'Team B']).toContain(winner);
    });

    test('should handle single team scenario', () => {
      const teams: TeamData[] = [
        { Team: 'Only Team', Points: 1000, Submissions: 5, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const winner = selectWeightedWinner(teams);
      expect(winner).toBe('Only Team');
    });

    test('should handle teams that exceed all thresholds', () => {
      const teams: TeamData[] = [
        { Team: 'High Scorer', Points: 5000, Submissions: 10, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Medium Scorer', Points: 2000, Submissions: 5, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const result = simulateCompleteRaffle(teams, defaultRounds);
      
      // Should complete all rounds
      expect(result.roundsCompleted).toBe(defaultRounds.length);
      expect(result.winners).toHaveLength(defaultRounds.length);
      
      // All winners should be unique
      const uniqueWinners = new Set(result.winners);
      expect(uniqueWinners.size).toBe(result.winners.length);
    });

    test('should handle teams that meet no thresholds', () => {
      const teams: TeamData[] = [
        { Team: 'Low Scorer 1', Points: 50, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Low Scorer 2', Points: 75, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const result = simulateCompleteRaffle(teams, defaultRounds);
      
      // Should only complete first round (threshold 0)
      expect(result.roundsCompleted).toBe(1);
      expect(result.winners).toHaveLength(1);
    });
  });

  describe('Stress Testing', () => {
    test('should handle large number of teams efficiently', () => {
      const startTime = performance.now();
      const teams = generateDistributedTeams(5000);
      const result = simulateCompleteRaffle(teams, defaultRounds);
      const endTime = performance.now();
      
      expect(result.winners).toBeDefined();
      expect(result.roundsCompleted).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should maintain consistency across many iterations', () => {
      const teams = generateDistributedTeams(100);
      const results = [];
      
      for (let i = 0; i < 1000; i++) {
        const result = simulateCompleteRaffle(teams, defaultRounds);
        results.push(result);
      }
      
      // Check that results are reasonable
      const averageWinners = results.reduce((sum, r) => sum + r.winners.length, 0) / results.length;
      const averageRounds = results.reduce((sum, r) => sum + r.roundsCompleted, 0) / results.length;
      
      expect(averageWinners).toBeGreaterThan(0);
      expect(averageWinners).toBeLessThanOrEqual(defaultRounds.length);
      expect(averageRounds).toBeGreaterThan(0);
      expect(averageRounds).toBeLessThanOrEqual(defaultRounds.length);
    });

    test('should handle extreme point distributions', () => {
      const extremeTeams: TeamData[] = [
        { Team: 'Mega High', Points: 100000, Submissions: 1000, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Very Low', Points: 1, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Zero', Points: 0, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const runs = 1000;
      let megaHighWins = 0;
      
      for (let i = 0; i < runs; i++) {
        const winner = selectWeightedWinner(extremeTeams);
        if (winner === 'Mega High') megaHighWins++;
      }
      
      // Mega High should win the vast majority due to having 1000 tickets vs 0-0 tickets
      expect(megaHighWins / runs).toBeGreaterThan(0.95);
    });
  });

  describe('Statistical Validation', () => {
    test('should produce statistically sound results for equal teams', () => {
      const equalTeams: TeamData[] = Array.from({ length: 10 }, (_, i) => ({
        Team: `Team ${i + 1}`,
        Points: 1000, // All teams have same points = same tickets
        Submissions: 10,
        'Last Submission': '2024-01-01',
        status: 'eligible' as const,
      }));
      
      const runs = 5000;
      const winCounts: { [key: string]: number } = {};
      
      // Initialize counts
      equalTeams.forEach(team => {
        winCounts[team.Team] = 0;
      });
      
      // Run simulations
      for (let i = 0; i < runs; i++) {
        const winner = selectWeightedWinner(equalTeams);
        winCounts[winner]++;
      }
      
      // Check that distribution is roughly equal (within statistical bounds)
      const expectedWins = runs / equalTeams.length;
      const tolerance = expectedWins * 0.1; // 10% tolerance
      
      Object.values(winCounts).forEach(count => {
        expect(count).toBeGreaterThan(expectedWins - tolerance);
        expect(count).toBeLessThan(expectedWins + tolerance);
      });
    });

    test('should respect weighted probabilities proportionally', () => {
      const weightedTeams: TeamData[] = [
        { Team: '1 Ticket', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: '2 Tickets', Points: 200, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: '3 Tickets', Points: 300, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const runs = 6000;
      const winCounts: { [key: string]: number } = { '1 Ticket': 0, '2 Tickets': 0, '3 Tickets': 0 };
      
      for (let i = 0; i < runs; i++) {
        const winner = selectWeightedWinner(weightedTeams);
        winCounts[winner]++;
      }
      
      // Expected proportions: 1:2:3 ratio
      const total = runs;
      const expected1 = total * (1/6);
      const expected2 = total * (2/6);
      const expected3 = total * (3/6);
      
      const tolerance = 0.05; // 5% tolerance
      
      expect(Math.abs(winCounts['1 Ticket'] - expected1) / expected1).toBeLessThan(tolerance);
      expect(Math.abs(winCounts['2 Tickets'] - expected2) / expected2).toBeLessThan(tolerance);
      expect(Math.abs(winCounts['3 Tickets'] - expected3) / expected3).toBeLessThan(tolerance);
    });
  });

  describe('Round Threshold Testing', () => {
    test('should strictly enforce point thresholds', () => {
      const mixedTeams: TeamData[] = [
        { Team: 'Threshold 100', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Threshold 300', Points: 300, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Threshold 600', Points: 600, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Threshold 800', Points: 800, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
        { Team: 'Threshold 1200', Points: 1200, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' },
      ];
      
      const runs = 1000;
      const invalidSelections: { [roundIndex: number]: string[] } = {};
      
      for (let run = 0; run < runs; run++) {
        const result = simulateCompleteRaffle(mixedTeams, defaultRounds);
        
        result.eliminationDetails?.forEach(detail => {
          const roundThreshold = defaultRounds[detail.round - 1].pointThreshold;
          const winnerTeam = mixedTeams.find(t => t.Team === detail.winner);
          
          if (winnerTeam && winnerTeam.Points < roundThreshold) {
            if (!invalidSelections[detail.round]) invalidSelections[detail.round] = [];
            invalidSelections[detail.round].push(detail.winner);
          }
        });
      }
      
      // Should have no invalid selections
      expect(Object.keys(invalidSelections)).toHaveLength(0);
    });

    test('should handle exact threshold matches', () => {
      const thresholdTeams: TeamData[] = defaultRounds.map((round) => ({
        Team: `Exact ${round.pointThreshold}`,
        Points: round.pointThreshold,
        Submissions: 1,
        'Last Submission': '2024-01-01',
        status: 'eligible' as const,
      }));
      
      const result = simulateCompleteRaffle(thresholdTeams, defaultRounds);
      
      // All teams should be eligible for their respective rounds
      expect(result.roundsCompleted).toBeGreaterThan(0);
      expect(result.winners).toBeDefined();
    });
  });

  describe('Performance Benchmarking', () => {
    test('should scale linearly with team count', () => {
      const teamCounts = [100, 200, 400];
      const times: number[] = [];
      
      teamCounts.forEach(count => {
        const teams = generateDistributedTeams(count);
        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
          simulateCompleteRaffle(teams, defaultRounds);
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      });
      
      // Check that time scaling is reasonable (should be roughly linear)
      const ratio1 = times[1] / times[0]; // 200 vs 100 teams
      const ratio2 = times[2] / times[1]; // 400 vs 200 teams
      
      // Should be between 1.5x and 3x (allowing for some overhead)
      expect(ratio1).toBeGreaterThan(1.5);
      expect(ratio1).toBeLessThan(3);
      expect(ratio2).toBeGreaterThan(1.5);
      expect(ratio2).toBeLessThan(3);
    });

    test('should complete simulations within reasonable time limits', () => {
      const performanceScenarios = [
        { teams: 1000, runs: 10, maxTime: 1000 },
        { teams: 2000, runs: 5, maxTime: 1000 },
        { teams: 5000, runs: 1, maxTime: 500 },
      ];
      
      performanceScenarios.forEach(scenario => {
        const startTime = performance.now();
        const result = runComprehensiveSimulation(scenario.teams, scenario.runs, 'normal', 'Performance Test');
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(scenario.maxTime);
        expect(result.totalRuns).toBe(scenario.runs);
        expect(result.teamCount).toBe(scenario.teams);
      });
    });
  });

  describe('Comprehensive Simulation Validation', () => {
    test('should run multi-distribution analysis successfully', () => {
      const teamCount = 200;
      const runs = 100;
      const distributions: Array<'uniform' | 'normal' | 'skewed'> = ['uniform', 'normal', 'skewed'];
      
      const results = distributions.map(dist => 
        runComprehensiveSimulation(teamCount, runs, dist, `Distribution Test (${dist})`)
      );
      
      // All simulations should complete successfully
      results.forEach(result => {
        expect(result.totalRuns).toBe(runs);
        expect(result.teamCount).toBe(teamCount);
        expect(result.fairnessScore).toBeGreaterThan(0);
        expect(result.executionTime).toBeGreaterThan(0);
        expect(result.detailedStats).toHaveLength(teamCount);
      });
      
      // Different distributions should produce different fairness scores
      const fairnessScores = results.map(r => r.fairnessScore);
      const uniqueScores = new Set(fairnessScores.map(s => Math.round(s * 10000)));
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    test('should handle edge cases in comprehensive simulation', () => {
      const result = runComprehensiveSimulation(50, 200, 'normal', 'Edge Case Test');
      
      // Validate edge case tracking
      expect(result.edgeCases.noWinners).toBeGreaterThanOrEqual(0);
      expect(result.edgeCases.allRoundsCompleted).toBeGreaterThanOrEqual(0);
      expect(result.edgeCases.singleRoundOnly).toBeGreaterThanOrEqual(0);
      
      // Sum of edge cases should not exceed total runs
      const totalEdgeCases = result.edgeCases.noWinners + result.edgeCases.allRoundsCompleted + result.edgeCases.singleRoundOnly;
      expect(totalEdgeCases).toBeLessThanOrEqual(result.totalRuns);
      
      // Performance metrics should be valid
      expect(result.performanceMetrics.avgTimePerRun).toBeGreaterThan(0);
      expect(result.performanceMetrics.minTimePerRun).toBeGreaterThan(0);
      expect(result.performanceMetrics.maxTimePerRun).toBeGreaterThanOrEqual(result.performanceMetrics.minTimePerRun);
    });
  });

  describe('Real-world Scenario Testing', () => {
    test('should handle realistic event scenarios', () => {
      // Simulate a realistic conference raffle scenario
      const conferenceTeams: TeamData[] = [];
      
      // 60% casual participants (low points)
      for (let i = 1; i <= 60; i++) {
        conferenceTeams.push({
          Team: `Casual ${i}`,
          Points: Math.floor(Math.random() * 300) + 50, // 50-350 points
          Submissions: Math.floor(Math.random() * 3) + 1, // 1-3 submissions
          'Last Submission': '2024-01-01',
          status: 'eligible',
        });
      }
      
      // 30% active participants (medium points)
      for (let i = 1; i <= 30; i++) {
        conferenceTeams.push({
          Team: `Active ${i}`,
          Points: Math.floor(Math.random() * 700) + 300, // 300-1000 points
          Submissions: Math.floor(Math.random() * 5) + 3, // 3-7 submissions
          'Last Submission': '2024-01-01',
          status: 'eligible',
        });
      }
      
      // 10% super engaged (high points)
      for (let i = 1; i <= 10; i++) {
        conferenceTeams.push({
          Team: `Super ${i}`,
          Points: Math.floor(Math.random() * 1000) + 1000, // 1000-2000 points
          Submissions: Math.floor(Math.random() * 10) + 5, // 5-15 submissions
          'Last Submission': '2024-01-01',
          status: 'eligible',
        });
      }
      
      const result = runComprehensiveSimulation(100, 500, 'normal', 'Conference Scenario');
      
      // Should complete successfully
      expect(result.totalRuns).toBe(500);
      expect(result.teamCount).toBe(100);
      
      // Super engaged participants should have higher win rates
      const superStats = result.detailedStats.filter(stat => stat.teamName.startsWith('Super'));
      const casualStats = result.detailedStats.filter(stat => stat.teamName.startsWith('Casual'));
      
      const avgSuperWinRate = superStats.reduce((sum, stat) => sum + stat.winRate, 0) / superStats.length;
      const avgCasualWinRate = casualStats.reduce((sum, stat) => sum + stat.winRate, 0) / casualStats.length;
      
      expect(avgSuperWinRate).toBeGreaterThan(avgCasualWinRate);
    });

    test('should provide reasonable fairness metrics for real-world data', () => {
      const result = runComprehensiveSimulation(300, 200, 'skewed', 'Real-world Fairness Test');
      
      // Fairness score should be reasonable (not perfect, but not terrible)
      expect(result.fairnessScore).toBeGreaterThan(0);
      expect(result.fairnessScore).toBeLessThan(0.5); // Should be relatively fair
      
      // Most teams should have reasonable fairness ratios
      const reasonableFairnessTeams = result.detailedStats.filter(stat => 
        stat.expectedWinRate > 0 && stat.fairnessRatio >= 0.1 && stat.fairnessRatio <= 10
      );
      
      const reasonableFairnessRate = reasonableFairnessTeams.length / result.detailedStats.filter(s => s.expectedWinRate > 0).length;
      expect(reasonableFairnessRate).toBeGreaterThan(0.8); // At least 80% should be reasonable
    });
  });
});

// Export test utilities for manual testing
export {
  generateDistributedTeams,
  selectWeightedWinner,
  simulateCompleteRaffle,
  runComprehensiveSimulation,
  defaultRounds
};
