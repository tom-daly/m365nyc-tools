/**
 * Efficient Data Analysis Script for M365 NYC Raffle System
 * 
 * This script runs 1000 simulations with memory-efficient data collection
 * and generates comprehensive analysis reports.
 */

import { TeamData, RaffleRound } from '../src/types/raffle';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Streamlined data structures
interface ParticipantProfile {
  user_id: string;
  username: string;
  total_points: number;
  tickets: number;
  engagement_level: 'low' | 'medium' | 'high' | 'power';
  actions: {
    quiz: number;
    registration: number;
    photo: number;
    challenge: number;
    bonus: number;
  };
  entry_time: Date;
}

interface SimulationSummary {
  simulation_id: number;
  winners_by_round: { [round: number]: string };
  total_participants: number;
  total_tickets: number;
}

interface ComprehensiveAnalysis {
  overview: {
    total_simulations: number;
    total_participants: number;
    total_wins: number;
    avg_wins_per_simulation: number;
  };
  win_rates: {
    user_id: string;
    username: string;
    win_count: number;
    win_rate: number;
    avg_points: number;
    avg_tickets: number;
    engagement_level: string;
    bias_score: number;
  }[];
  engagement_analysis: {
    [level: string]: {
      user_count: number;
      avg_win_rate: number;
      avg_tickets: number;
      total_wins: number;
    };
  };
  mission_effectiveness: {
    mission_type: string;
    participants: number;
    avg_win_rate: number;
    effort_ratio: number;
  }[];
  time_patterns: {
    period: string;
    win_rate: number;
    competition_level: number;
  }[];
  bias_detection: {
    high_bias_users: {
      username: string;
      bias_score: number;
      direction: 'over' | 'under';
    }[];
    statistical_summary: {
      users_within_5_percent: number;
      users_with_significant_bias: number;
      max_positive_bias: number;
      max_negative_bias: number;
    };
  };
}

// Default raffle configuration
const defaultRounds: RaffleRound[] = [
  { id: 1, name: "Round 1", pointThreshold: 0, description: "All eligible" },
  { id: 2, name: "Round 2", pointThreshold: 250, description: "250+ points" },
  { id: 3, name: "Round 3", pointThreshold: 500, description: "500+ points" },
  { id: 4, name: "Round 4", pointThreshold: 750, description: "750+ points" },
  { id: 5, name: "Final Round", pointThreshold: 1000, description: "1000+ points" }
];

// Generate realistic participants
function generateParticipants(count: number): ParticipantProfile[] {
  const participants: ParticipantProfile[] = [];
  
  for (let i = 1; i <= count; i++) {
    const quiz = Math.floor(Math.random() * 10);
    const registration = Math.random() < 0.8 ? 1 : 0;
    const photo = Math.floor(Math.random() * 5);
    const challenge = Math.floor(Math.random() * 8);
    const bonus = Math.floor(Math.random() * 3);
    
    const total_points = Math.max(0, (quiz * 50) + (registration * 100) + (photo * 75) + (challenge * 120) + (bonus * 200) + Math.floor(Math.random() * 300));
    const tickets = Math.max(1, Math.floor(total_points / 100));
    
    const totalActions = quiz + registration + photo + challenge + bonus;
    let engagement_level: 'low' | 'medium' | 'high' | 'power';
    if (totalActions <= 5) engagement_level = 'low';
    else if (totalActions <= 15) engagement_level = 'medium';
    else if (totalActions <= 25) engagement_level = 'high';
    else engagement_level = 'power';
    
    const entry_time = new Date(2024, 0, 1 + Math.floor(Math.random() * 31));
    
    participants.push({
      user_id: `user_${i}`,
      username: `User_${i.toString().padStart(3, '0')}`,
      total_points,
      tickets,
      engagement_level,
      actions: { quiz, registration, photo, challenge, bonus },
      entry_time
    });
  }
  
  return participants.sort((a, b) => b.total_points - a.total_points);
}

// Efficient weighted selection
function selectWinner(participants: ParticipantProfile[]): ParticipantProfile {
  if (participants.length === 0) throw new Error('No participants');
  
  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
  if (totalTickets === 0) return participants[Math.floor(Math.random() * participants.length)];
  
  const winning_ticket = Math.floor(Math.random() * totalTickets) + 1;
  let current_ticket = 0;
  
  for (const participant of participants) {
    current_ticket += participant.tickets;
    if (winning_ticket <= current_ticket) {
      return participant;
    }
  }
  
  return participants[0];
}

// Run single simulation
function runSimulation(participants: ParticipantProfile[], simulationId: number): SimulationSummary {
  const winners: { [round: number]: string } = {};
  let remaining = [...participants];
  
  for (const round of defaultRounds) {
    const eligible = remaining.filter(p => p.total_points >= round.pointThreshold);
    if (eligible.length === 0) break;
    
    const winner = selectWinner(eligible);
    winners[round.id] = winner.user_id;
    remaining = remaining.filter(p => p.user_id !== winner.user_id);
  }
  
  return {
    simulation_id: simulationId,
    winners_by_round: winners,
    total_participants: participants.length,
    total_tickets: participants.reduce((sum, p) => sum + p.tickets, 0)
  };
}

// Comprehensive analysis
function analyzeResults(participants: ParticipantProfile[], simulations: SimulationSummary[]): ComprehensiveAnalysis {
  // Win rate analysis
  const userWins: { [userId: string]: number } = {};
  let totalWins = 0;
  
  for (const sim of simulations) {
    for (const winner of Object.values(sim.winners_by_round)) {
      userWins[winner] = (userWins[winner] || 0) + 1;
      totalWins++;
    }
  }
  
  const win_rates = participants.map(p => {
    const wins = userWins[p.user_id] || 0;
    const win_rate = wins / simulations.length;
    const expected_rate = p.tickets / 1000; // Rough estimate
    const bias_score = win_rate - expected_rate;
    
    return {
      user_id: p.user_id,
      username: p.username,
      win_count: wins,
      win_rate,
      avg_points: p.total_points,
      avg_tickets: p.tickets,
      engagement_level: p.engagement_level,
      bias_score
    };
  }).sort((a, b) => b.win_rate - a.win_rate);
  
  // Engagement analysis
  const engagement_analysis: { [level: string]: any } = {};
  const engagementLevels = ['low', 'medium', 'high', 'power'];
  
  for (const level of engagementLevels) {
    const levelUsers = participants.filter(p => p.engagement_level === level);
    const levelWins = levelUsers.reduce((sum, p) => sum + (userWins[p.user_id] || 0), 0);
    
    if (levelUsers.length > 0) {
      engagement_analysis[level] = {
        user_count: levelUsers.length,
        avg_win_rate: levelWins / (levelUsers.length * simulations.length),
        avg_tickets: levelUsers.reduce((sum, p) => sum + p.tickets, 0) / levelUsers.length,
        total_wins: levelWins
      };
    }
  }
  
  // Mission effectiveness
  const missionTypes = ['quiz', 'registration', 'photo', 'challenge', 'bonus'];
  const mission_effectiveness = missionTypes.map(mission => {
    const participants_with_mission = participants.filter(p => p.actions[mission as keyof typeof p.actions] > 0);
    const wins_with_mission = participants_with_mission.reduce((sum, p) => sum + (userWins[p.user_id] || 0), 0);
    
    return {
      mission_type: mission,
      participants: participants_with_mission.length,
      avg_win_rate: participants_with_mission.length > 0 ? wins_with_mission / (participants_with_mission.length * simulations.length) : 0,
      effort_ratio: participants_with_mission.length > 0 ? participants_with_mission.reduce((sum, p) => sum + p.actions[mission as keyof typeof p.actions], 0) / wins_with_mission : 0
    };
  }).sort((a, b) => a.effort_ratio - b.effort_ratio);
  
  // Time patterns
  const timeWindows = [
    { name: 'Early (Days 1-7)', start: 1, end: 7 },
    { name: 'Mid (Days 8-15)', start: 8, end: 15 },
    { name: 'Late (Days 16-23)', start: 16, end: 23 },
    { name: 'Final (Days 24-31)', start: 24, end: 31 }
  ];
  
  const time_patterns = timeWindows.map(window => {
    const window_participants = participants.filter(p => {
      const day = p.entry_time.getDate();
      return day >= window.start && day <= window.end;
    });
    
    const window_wins = window_participants.reduce((sum, p) => sum + (userWins[p.user_id] || 0), 0);
    
    return {
      period: window.name,
      win_rate: window_participants.length > 0 ? window_wins / (window_participants.length * simulations.length) : 0,
      competition_level: window_participants.length
    };
  });
  
  // Bias detection
  const high_bias_users = win_rates
    .filter(w => Math.abs(w.bias_score) > 0.05)
    .slice(0, 10)
    .map(w => ({
      username: w.username,
      bias_score: w.bias_score,
      direction: w.bias_score > 0 ? 'over' as const : 'under' as const
    }));
  
  const users_within_5_percent = win_rates.filter(w => Math.abs(w.bias_score) <= 0.05).length;
  const users_with_significant_bias = win_rates.filter(w => Math.abs(w.bias_score) > 0.05).length;
  const max_positive_bias = Math.max(...win_rates.map(w => w.bias_score));
  const max_negative_bias = Math.min(...win_rates.map(w => w.bias_score));
  
  return {
    overview: {
      total_simulations: simulations.length,
      total_participants: participants.length,
      total_wins: totalWins,
      avg_wins_per_simulation: totalWins / simulations.length
    },
    win_rates,
    engagement_analysis,
    mission_effectiveness,
    time_patterns,
    bias_detection: {
      high_bias_users,
      statistical_summary: {
        users_within_5_percent,
        users_with_significant_bias,
        max_positive_bias,
        max_negative_bias
      }
    }
  };
}

// Generate markdown report
function generateReport(analysis: ComprehensiveAnalysis): string {
  const { overview, win_rates, engagement_analysis, mission_effectiveness, time_patterns, bias_detection } = analysis;
  
  return `# 🎯 M365 NYC Raffle System - Comprehensive Analysis Report

## 📊 Simulation Overview
- **Total Simulations:** ${overview.total_simulations}
- **Total Participants:** ${overview.total_participants}
- **Total Wins:** ${overview.total_wins}
- **Average Wins per Simulation:** ${overview.avg_wins_per_simulation.toFixed(2)}

## 🏆 Top 10 Winners by Success Rate

${win_rates.slice(0, 10).map((w, i) => `${i + 1}. **${w.username}** (${w.engagement_level})
   - Win Rate: ${(w.win_rate * 100).toFixed(2)}%
   - Total Wins: ${w.win_count}
   - Avg Points: ${w.avg_points}
   - Avg Tickets: ${w.avg_tickets}
   - Bias Score: ${w.bias_score > 0 ? '+' : ''}${(w.bias_score * 100).toFixed(2)}%`).join('\n\n')}

## 📈 Win Rate by Engagement Level

${Object.entries(engagement_analysis).map(([level, stats]) => `- **${level.toUpperCase()}** (${stats.user_count} users): ${(stats.avg_win_rate * 100).toFixed(2)}% win rate, ${stats.avg_tickets.toFixed(1)} avg tickets`).join('\n')}

## 🎮 Mission Effectiveness Analysis

${mission_effectiveness.map((m, i) => `${i + 1}. **${m.mission_type.toUpperCase()}**
   - Participants: ${m.participants}
   - Win Rate: ${(m.avg_win_rate * 100).toFixed(2)}%
   - Effort Ratio: ${m.effort_ratio.toFixed(2)} (lower is better)`).join('\n\n')}

## ⏰ Time-Based Analysis

${time_patterns.map(t => `- **${t.period}**: ${(t.win_rate * 100).toFixed(2)}% win rate (${t.competition_level} participants)`).join('\n')}

## 🔍 Bias Detection

### Statistical Summary
- Users within 5% of expected: ${bias_detection.statistical_summary.users_within_5_percent}
- Users with significant bias: ${bias_detection.statistical_summary.users_with_significant_bias}
- Max positive bias: +${(bias_detection.statistical_summary.max_positive_bias * 100).toFixed(2)}%
- Max negative bias: ${(bias_detection.statistical_summary.max_negative_bias * 100).toFixed(2)}%

${bias_detection.high_bias_users.length > 0 ? `### High Bias Users
${bias_detection.high_bias_users.map(u => `- ${u.username}: ${u.direction === 'over' ? 'OVER' : 'UNDER'}-performing by ${Math.abs(u.bias_score * 100).toFixed(2)}%`).join('\n')}` : '✅ No significant bias detected.'}

## 📋 Key Insights

1. **Fairness:** ${bias_detection.statistical_summary.users_within_5_percent / overview.total_participants * 100 > 80 ? '✅ System shows good fairness' : '⚠️ Some bias detected'}
2. **Best Mission:** ${mission_effectiveness[0].mission_type} shows best effort-to-reward ratio
3. **Optimal Timing:** ${time_patterns.reduce((best, current) => current.win_rate > best.win_rate ? current : best).period}
4. **Engagement Impact:** ${Object.entries(engagement_analysis).reduce((best, [level, stats]) => stats.avg_win_rate > best.rate ? {level, rate: stats.avg_win_rate} : best, {level: 'medium', rate: 0}).level} engagement level performs best

---
*Generated on ${new Date().toISOString()}*
`;
}

// Main execution
async function runAnalysis() {
  console.log('🚀 Starting Efficient Data Analysis...');
  
  const participants = generateParticipants(500);
  console.log(`✅ Generated ${participants.length} participants`);
  
  console.log('🎯 Running 1000 simulations...');
  const simulations: SimulationSummary[] = [];
  
  for (let i = 1; i <= 1000; i++) {
    simulations.push(runSimulation(participants, i));
    if (i % 100 === 0) {
      console.log(`   Progress: ${i}/1000 simulations complete`);
    }
  }
  
  console.log('📈 Analyzing results...');
  const analysis = analyzeResults(participants, simulations);
  
  console.log('📝 Generating report...');
  const report = generateReport(analysis);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dataDir = join(process.cwd(), 'data');
  
  try {
    // Save analysis data
    writeFileSync(join(dataDir, `analysis_${timestamp}.json`), JSON.stringify(analysis, null, 2));
    
    // Save report
    writeFileSync(join(dataDir, `report_${timestamp}.md`), report);
    
    console.log('✅ Analysis complete! Results saved:');
    console.log(`   - analysis_${timestamp}.json`);
    console.log(`   - report_${timestamp}.md`);
    
    // Display key results
    console.log('\n' + '='.repeat(60));
    console.log('📊 KEY RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Simulations: ${analysis.overview.total_simulations}`);
    console.log(`Total Participants: ${analysis.overview.total_participants}`);
    console.log(`Top Winner: ${analysis.win_rates[0].username} (${(analysis.win_rates[0].win_rate * 100).toFixed(2)}% win rate)`);
    console.log(`Best Mission: ${analysis.mission_effectiveness[0].mission_type}`);
    console.log(`Fairness: ${analysis.bias_detection.statistical_summary.users_within_5_percent}/${analysis.overview.total_participants} users within 5% expected`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error saving results:', error);
  }
}

if (require.main === module) {
  runAnalysis().catch(console.error);
}

export { runAnalysis };