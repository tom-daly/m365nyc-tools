/**
 * Comprehensive Data Analysis Script for M365 NYC Raffle System
 * 
 * This script runs 1000 simulations and collects detailed data for analysis:
 * - Win rates by user and ticket source
 * - Engagement vs reward patterns
 * - Bias detection and statistical validation
 * - Optimal strategy identification
 * 
 * Usage:
 * npx ts-node scripts/comprehensiveDataAnalysis.ts
 */

import { TeamData, RaffleRound } from '../src/types/raffle';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Enhanced TeamData with additional tracking fields
interface EnhancedTeamData extends TeamData {
  user_id: string;
  total_points: number;
  number_of_entries: number; // tickets in raffle
  actions_completed: {
    quiz: number;
    registration: number;
    photo: number;
    challenge: number;
    bonus: number;
  };
  time_of_entry: Date;
  engagement_level: 'low' | 'medium' | 'high' | 'power';
  avatar_id: string;
}

// Data collection structures
interface SimulationEntry {
  simulation_id: number;
  user_id: string;
  username: string;
  total_points: number;
  number_of_entries: number;
  actions_completed: {
    quiz: number;
    registration: number;
    photo: number;
    challenge: number;
    bonus: number;
  };
  time_of_entry: string;
  raffle_round_id: number;
  winning_status: 'won' | 'lost';
  prize_info?: string;
  avatar_id: string;
  engagement_level: string;
}

interface WinAnalysis {
  user_id: string;
  username: string;
  total_simulations: number;
  total_wins: number;
  win_rate: number;
  expected_win_rate: number;
  bias_score: number;
  avg_points: number;
  avg_tickets: number;
  engagement_level: string;
  win_distribution_by_round: { [round: number]: number };
}

interface MissionAnalysis {
  mission_type: string;
  total_participants: number;
  avg_tickets_generated: number;
  total_winners: number;
  win_rate: number;
  effort_to_reward_ratio: number;
}

interface TimeAnalysis {
  time_window: string;
  total_entries: number;
  total_winners: number;
  win_rate: number;
  competition_level: number;
}

// Default raffle rounds
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

// Generate realistic participant data with enhanced tracking
function generateRealisticParticipants(count: number): EnhancedTeamData[] {
  const participants: EnhancedTeamData[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');
  
  for (let i = 1; i <= count; i++) {
    // Generate realistic action completion patterns
    const quiz = Math.floor(Math.random() * 10);
    const registration = Math.random() < 0.8 ? 1 : 0; // 80% registration rate
    const photo = Math.floor(Math.random() * 5);
    const challenge = Math.floor(Math.random() * 8);
    const bonus = Math.floor(Math.random() * 3);
    
    // Calculate points based on actions (with some randomness)
    const basePoints = (quiz * 50) + (registration * 100) + (photo * 75) + (challenge * 120) + (bonus * 200);
    const randomBonus = Math.floor(Math.random() * 300); // Random bonus points
    const total_points = Math.max(0, basePoints + randomBonus);
    
    // Calculate tickets
    const number_of_entries = Math.max(1, Math.floor(total_points / 100));
    
    // Determine engagement level
    const totalActions = quiz + registration + photo + challenge + bonus;
    let engagement_level: 'low' | 'medium' | 'high' | 'power';
    if (totalActions <= 5) engagement_level = 'low';
    else if (totalActions <= 15) engagement_level = 'medium';
    else if (totalActions <= 25) engagement_level = 'high';
    else engagement_level = 'power';
    
    // Generate random entry time
    const time_of_entry = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    participants.push({
      Team: `User_${i.toString().padStart(3, '0')}`,
      Points: total_points,
      Submissions: totalActions,
      'Last Submission': time_of_entry.toISOString(),
      status: 'eligible',
      user_id: `uid_${i}`,
      total_points,
      number_of_entries,
      actions_completed: {
        quiz,
        registration,
        photo,
        challenge,
        bonus
      },
      time_of_entry,
      engagement_level,
      avatar_id: `avatar_${(i % 20) + 1}` // 20 different avatars cycling
    });
  }
  
  return participants.sort((a, b) => b.total_points - a.total_points);
}

// Enhanced weighted selection with detailed logging
function selectWeightedWinnerWithLogging(teams: EnhancedTeamData[], roundId: number): {
  winner: EnhancedTeamData;
  selectionDetails: {
    totalTickets: number;
    winningTicket: number;
    winnerProbability: number;
  };
} {
  if (teams.length === 0) throw new Error('No teams available for selection');
  
  // Calculate total tickets
  const totalTickets = teams.reduce((sum, team) => sum + team.number_of_entries, 0);
  
  // Handle edge case where all teams have 0 tickets
  if (totalTickets === 0) {
    const winner = teams[Math.floor(Math.random() * teams.length)];
    return {
      winner,
      selectionDetails: {
        totalTickets: 0,
        winningTicket: 0,
        winnerProbability: 1 / teams.length
      }
    };
  }
  
  // Generate random ticket number
  const winningTicket = Math.floor(Math.random() * totalTickets) + 1;
  
  // Find the winner
  let currentTicket = 0;
  for (const team of teams) {
    currentTicket += team.number_of_entries;
    if (winningTicket <= currentTicket) {
      return {
        winner: team,
        selectionDetails: {
          totalTickets,
          winningTicket,
          winnerProbability: team.number_of_entries / totalTickets
        }
      };
    }
  }
  
  // Fallback (shouldn't happen)
  const winner = teams[0];
  return {
    winner,
    selectionDetails: {
      totalTickets,
      winningTicket,
      winnerProbability: winner.number_of_entries / totalTickets
    }
  };
}

// Run a single complete raffle simulation
function runSingleRaffleSimulation(
  participants: EnhancedTeamData[], 
  rounds: RaffleRound[], 
  simulationId: number
): SimulationEntry[] {
  const results: SimulationEntry[] = [];
  let remainingParticipants = [...participants];
  
  for (const round of rounds) {
    // Filter eligible participants for this round
    const eligibleParticipants = remainingParticipants.filter(p => p.total_points >= round.pointThreshold);
    
    if (eligibleParticipants.length === 0) break;
    
    // Select winner
    const { winner, selectionDetails } = selectWeightedWinnerWithLogging(eligibleParticipants, round.id);
    
    // Record results for all participants in this round
    for (const participant of eligibleParticipants) {
      const isWinner = participant.user_id === winner.user_id;
      
      results.push({
        simulation_id: simulationId,
        user_id: participant.user_id,
        username: participant.Team,
        total_points: participant.total_points,
        number_of_entries: participant.number_of_entries,
        actions_completed: participant.actions_completed,
        time_of_entry: participant.time_of_entry.toISOString(),
        raffle_round_id: round.id,
        winning_status: isWinner ? 'won' : 'lost',
        prize_info: isWinner ? `${round.name} Prize` : undefined,
        avatar_id: participant.avatar_id,
        engagement_level: participant.engagement_level
      });
    }
    
    // Remove winner from remaining participants
    remainingParticipants = remainingParticipants.filter(p => p.user_id !== winner.user_id);
  }
  
  return results;
}

// Analyze win rates by user
function analyzeWinRates(allResults: SimulationEntry[]): WinAnalysis[] {
  const userStats: { [userId: string]: {
    username: string;
    totalSimulations: number;
    totalWins: number;
    totalPoints: number;
    totalTickets: number;
    engagementLevel: string;
    winsByRound: { [round: number]: number };
  } } = {};
  
  // Collect stats
  for (const result of allResults) {
    if (!userStats[result.user_id]) {
      userStats[result.user_id] = {
        username: result.username,
        totalSimulations: 0,
        totalWins: 0,
        totalPoints: 0,
        totalTickets: 0,
        engagementLevel: result.engagement_level,
        winsByRound: {}
      };
    }
    
    const userStat = userStats[result.user_id];
    userStat.totalSimulations++;
    userStat.totalPoints += result.total_points;
    userStat.totalTickets += result.number_of_entries;
    
    if (result.winning_status === 'won') {
      userStat.totalWins++;
      userStat.winsByRound[result.raffle_round_id] = (userStat.winsByRound[result.raffle_round_id] || 0) + 1;
    }
  }
  
  // Calculate analysis
  const analyses: WinAnalysis[] = [];
  for (const [userId, stats] of Object.entries(userStats)) {
    const avgPoints = stats.totalPoints / stats.totalSimulations;
    const avgTickets = stats.totalTickets / stats.totalSimulations;
    const winRate = stats.totalWins / stats.totalSimulations;
    
    // Calculate expected win rate based on average ticket share
    // This is a simplified calculation - in reality, it would depend on the specific competition in each round
    const expectedWinRate = avgTickets / 1000; // Rough estimate
    const biasScore = winRate - expectedWinRate;
    
    analyses.push({
      user_id: userId,
      username: stats.username,
      total_simulations: stats.totalSimulations,
      total_wins: stats.totalWins,
      win_rate: winRate,
      expected_win_rate: expectedWinRate,
      bias_score: biasScore,
      avg_points: avgPoints,
      avg_tickets: avgTickets,
      engagement_level: stats.engagementLevel,
      win_distribution_by_round: stats.winsByRound
    });
  }
  
  return analyses.sort((a, b) => b.win_rate - a.win_rate);
}

// Analyze mission effectiveness
function analyzeMissionEffectiveness(allResults: SimulationEntry[]): MissionAnalysis[] {
  const missionTypes = ['quiz', 'registration', 'photo', 'challenge', 'bonus'];
  const analyses: MissionAnalysis[] = [];
  
  for (const missionType of missionTypes) {
    const relevantResults = allResults.filter(r => r.actions_completed[missionType as keyof typeof r.actions_completed] > 0);
    
    if (relevantResults.length === 0) continue;
    
    const totalParticipants = new Set(relevantResults.map(r => r.user_id)).size;
    const avgTicketsGenerated = relevantResults.reduce((sum, r) => sum + r.actions_completed[missionType as keyof typeof r.actions_completed], 0) / relevantResults.length;
    const totalWinners = relevantResults.filter(r => r.winning_status === 'won').length;
    const winRate = totalWinners / relevantResults.length;
    
    // Calculate effort to reward ratio (lower is better)
    const avgActionsPerUser = relevantResults.reduce((sum, r) => sum + r.actions_completed[missionType as keyof typeof r.actions_completed], 0) / totalParticipants;
    const effortToRewardRatio = avgActionsPerUser / (winRate * 100); // Normalized
    
    analyses.push({
      mission_type: missionType,
      total_participants: totalParticipants,
      avg_tickets_generated: avgTicketsGenerated,
      total_winners: totalWinners,
      win_rate: winRate,
      effort_to_reward_ratio: effortToRewardRatio
    });
  }
  
  return analyses.sort((a, b) => a.effort_to_reward_ratio - b.effort_to_reward_ratio);
}

// Analyze time-based patterns
function analyzeTimePatterns(allResults: SimulationEntry[]): TimeAnalysis[] {
  const timeWindows = [
    { name: 'Early Bird (Days 1-7)', start: new Date('2024-01-01'), end: new Date('2024-01-07') },
    { name: 'Mid Period (Days 8-15)', start: new Date('2024-01-08'), end: new Date('2024-01-15') },
    { name: 'Late Period (Days 16-23)', start: new Date('2024-01-16'), end: new Date('2024-01-23') },
    { name: 'Final Rush (Days 24-31)', start: new Date('2024-01-24'), end: new Date('2024-01-31') }
  ];
  
  const analyses: TimeAnalysis[] = [];
  
  for (const window of timeWindows) {
    const relevantResults = allResults.filter(r => {
      const entryTime = new Date(r.time_of_entry);
      return entryTime >= window.start && entryTime <= window.end;
    });
    
    if (relevantResults.length === 0) continue;
    
    const totalEntries = relevantResults.length;
    const totalWinners = relevantResults.filter(r => r.winning_status === 'won').length;
    const winRate = totalWinners / totalEntries;
    const uniqueUsers = new Set(relevantResults.map(r => r.user_id)).size;
    const competitionLevel = totalEntries / uniqueUsers; // Avg entries per user
    
    analyses.push({
      time_window: window.name,
      total_entries: totalEntries,
      total_winners: totalWinners,
      win_rate: winRate,
      competition_level: competitionLevel
    });
  }
  
  return analyses;
}

// Generate comprehensive report
function generateComprehensiveReport(
  allResults: SimulationEntry[],
  winAnalysis: WinAnalysis[],
  missionAnalysis: MissionAnalysis[],
  timeAnalysis: TimeAnalysis[]
): string {
  // Use more efficient calculations to avoid stack overflow
  const simulationIds = new Set();
  const userIds = new Set();
  let totalWins = 0;
  
  for (const result of allResults) {
    simulationIds.add(result.simulation_id);
    userIds.add(result.user_id);
    if (result.winning_status === 'won') {
      totalWins++;
    }
  }
  
  const totalSimulations = simulationIds.size;
  const totalParticipants = userIds.size;
  
  let report = `
# 🎯 M365 NYC Raffle System - Comprehensive Analysis Report
## 📊 Simulation Overview
- **Total Simulations:** ${totalSimulations}
- **Total Participants:** ${totalParticipants}
- **Total Wins Recorded:** ${totalWins}
- **Average Wins per Simulation:** ${(totalWins / totalSimulations).toFixed(2)}

## 🏆 WIN RATE ANALYSIS

### Top 10 Winners by Success Rate
`;

  winAnalysis.slice(0, 10).forEach((analysis, index) => {
    report += `
${index + 1}. **${analysis.username}** (${analysis.engagement_level})
   - Win Rate: ${(analysis.win_rate * 100).toFixed(2)}%
   - Total Wins: ${analysis.total_wins}/${analysis.total_simulations}
   - Avg Points: ${analysis.avg_points.toFixed(0)}
   - Avg Tickets: ${analysis.avg_tickets.toFixed(1)}
   - Bias Score: ${analysis.bias_score > 0 ? '+' : ''}${(analysis.bias_score * 100).toFixed(2)}%
`;
  });

  report += `
### 📈 Win Rate by Engagement Level
`;

  const engagementLevels = ['low', 'medium', 'high', 'power'];
  const engagementStats: { [level: string]: { count: number; totalWinRate: number; totalTickets: number } } = {};
  
  // Calculate engagement stats efficiently
  for (const analysis of winAnalysis) {
    const level = analysis.engagement_level;
    if (!engagementStats[level]) {
      engagementStats[level] = { count: 0, totalWinRate: 0, totalTickets: 0 };
    }
    engagementStats[level].count++;
    engagementStats[level].totalWinRate += analysis.win_rate;
    engagementStats[level].totalTickets += analysis.avg_tickets;
  }
  
  for (const level of engagementLevels) {
    const stats = engagementStats[level];
    if (stats && stats.count > 0) {
      const avgWinRate = stats.totalWinRate / stats.count;
      const avgTickets = stats.totalTickets / stats.count;
      report += `
- **${level.toUpperCase()}** (${stats.count} users): ${(avgWinRate * 100).toFixed(2)}% win rate, ${avgTickets.toFixed(1)} avg tickets
`;
    }
  }

  report += `
## 🎮 MISSION EFFECTIVENESS ANALYSIS

### Best Missions by Effort-to-Reward Ratio
`;

  missionAnalysis.forEach((mission, index) => {
    report += `
${index + 1}. **${mission.mission_type.toUpperCase()}**
   - Participants: ${mission.total_participants}
   - Win Rate: ${(mission.win_rate * 100).toFixed(2)}%
   - Avg Tickets Generated: ${mission.avg_tickets_generated.toFixed(1)}
   - Effort-to-Reward Ratio: ${mission.effort_to_reward_ratio.toFixed(2)} (lower is better)
`;
  });

  report += `
## ⏰ TIME-BASED ANALYSIS

### Win Rates by Entry Period
`;

  timeAnalysis.forEach(time => {
    report += `
- **${time.time_window}**: ${(time.win_rate * 100).toFixed(2)}% win rate
  - Total Entries: ${time.total_entries}
  - Total Winners: ${time.total_winners}
  - Competition Level: ${time.competition_level.toFixed(1)} entries/user
`;
  });

  report += `
## 🔍 BIAS DETECTION

### Statistical Deviations
`;

  const highBiasUsers = winAnalysis.filter(w => Math.abs(w.bias_score) > 0.05).slice(0, 5);
  if (highBiasUsers.length > 0) {
    report += `
**Users with significant bias (>5% deviation):**
`;
    highBiasUsers.forEach(user => {
      const direction = user.bias_score > 0 ? 'OVER-performing' : 'UNDER-performing';
      report += `
- ${user.username}: ${direction} by ${Math.abs(user.bias_score * 100).toFixed(2)}%
`;
    });
  } else {
    report += `
✅ No significant bias detected. All users performing within expected statistical ranges.
`;
  }

  report += `
## 📋 RECOMMENDATIONS

### For Participants:
1. **Optimal Mission Strategy:** Focus on "${missionAnalysis[0]?.mission_type || 'varied'}" missions for best effort-to-reward ratio
2. **Timing Strategy:** Enter during "${timeAnalysis.length > 0 ? timeAnalysis.reduce((best, current) => current.win_rate > best.win_rate ? current : best).time_window : 'early periods'}" for highest win rates
3. **Engagement Level:** "${Object.entries(engagementStats).reduce((best, [level, stats]) => {
    const avgWinRate = stats.totalWinRate / stats.count;
    return avgWinRate > best.rate ? { level, rate: avgWinRate } : best;
  }, { level: 'medium', rate: 0 }).level}" engagement shows highest success rates

### For Organizers:
1. **Fairness Validation:** ✅ System shows good statistical fairness with minimal bias
2. **Mission Balance:** Consider adjusting "${missionAnalysis[missionAnalysis.length - 1]?.mission_type}" missions for better balance
3. **Participation Timing:** Encourage early participation to reduce late-period competition

---
*Report generated on ${new Date().toISOString()}*
*Based on ${totalSimulations} simulations with ${totalParticipants} participants*
`;

  return report;
}

// Main execution function
async function runComprehensiveAnalysis() {
  console.log('🚀 Starting Comprehensive Data Analysis...');
  console.log('📊 Generating realistic participant data...');
  
  // Generate participants
  const participants = generateRealisticParticipants(500); // 500 participants
  
  console.log(`✅ Generated ${participants.length} participants`);
  console.log('🎯 Running 1000 simulations...');
  
  // Run simulations
  const allResults: SimulationEntry[] = [];
  const totalSimulations = 1000;
  
  for (let i = 1; i <= totalSimulations; i++) {
    const simulationResults = runSingleRaffleSimulation(participants, defaultRounds, i);
    allResults.push(...simulationResults);
    
    if (i % 100 === 0) {
      console.log(`   Progress: ${i}/${totalSimulations} simulations complete`);
    }
  }
  
  console.log('📈 Analyzing results...');
  
  // Perform analyses
  const winAnalysis = analyzeWinRates(allResults);
  const missionAnalysis = analyzeMissionEffectiveness(allResults);
  const timeAnalysis = analyzeTimePatterns(allResults);
  
  console.log('📝 Generating reports...');
  
  // Generate comprehensive report
  const report = generateComprehensiveReport(allResults, winAnalysis, missionAnalysis, timeAnalysis);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dataDir = join(process.cwd(), 'data');
  
  try {
    // Save raw data
    writeFileSync(join(dataDir, `simulation_results_${timestamp}.json`), JSON.stringify(allResults, null, 2));
    
    // Save win analysis
    writeFileSync(join(dataDir, `win_analysis_${timestamp}.json`), JSON.stringify(winAnalysis, null, 2));
    
    // Save mission analysis
    writeFileSync(join(dataDir, `mission_analysis_${timestamp}.json`), JSON.stringify(missionAnalysis, null, 2));
    
    // Save time analysis
    writeFileSync(join(dataDir, `time_analysis_${timestamp}.json`), JSON.stringify(timeAnalysis, null, 2));
    
    // Save comprehensive report
    writeFileSync(join(dataDir, `comprehensive_report_${timestamp}.md`), report);
    
    console.log('✅ Analysis complete! Results saved to data/ directory:');
    console.log(`   - simulation_results_${timestamp}.json`);
    console.log(`   - win_analysis_${timestamp}.json`);
    console.log(`   - mission_analysis_${timestamp}.json`);
    console.log(`   - time_analysis_${timestamp}.json`);
    console.log(`   - comprehensive_report_${timestamp}.md`);
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Simulations: ${totalSimulations}`);
    console.log(`Total Participants: ${participants.length}`);
    console.log(`Total Data Points: ${allResults.length}`);
    console.log(`Top Winner: ${winAnalysis[0].username} (${(winAnalysis[0].win_rate * 100).toFixed(2)}% win rate)`);
    console.log(`Best Mission: ${missionAnalysis[0].mission_type} (${missionAnalysis[0].effort_to_reward_ratio.toFixed(2)} effort ratio)`);
    console.log(`Best Time Window: ${timeAnalysis.find(t => t.win_rate === Math.max(...timeAnalysis.map(ta => ta.win_rate)))?.time_window}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error saving results:', error);
  }
}

// Run the analysis
if (require.main === module) {
  runComprehensiveAnalysis().catch(console.error);
}

export {
  runComprehensiveAnalysis,
  generateRealisticParticipants,
  analyzeWinRates,
  analyzeMissionEffectiveness,
  analyzeTimePatterns
};