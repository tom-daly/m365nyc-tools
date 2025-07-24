/**
 * Analyze Last Simulation Results
 * 
 * This script analyzes the most recent simulation data to answer specific questions:
 * 1. Did any users with 0 tickets win?
 * 2. Did any users with 1 ticket win?
 * 3. Did any users win 2 or more rounds?
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface SimulationAnalysis {
  user_id: string;
  username: string;
  win_count: number;
  win_rate: number;
  avg_points: number;
  avg_tickets: number;
  engagement_level: string;
  bias_score: number;
}

interface AnalysisData {
  overview: {
    total_simulations: number;
    total_participants: number;
    total_wins: number;
    avg_wins_per_simulation: number;
  };
  win_rates: SimulationAnalysis[];
  engagement_analysis: any;
  mission_effectiveness: any;
  time_patterns: any;
  bias_detection: any;
}

async function analyzeLastSimulation() {
  console.log('🔍 ANALYZING LAST SIMULATION RESULTS');
  console.log('=' .repeat(50));

  // Find the most recent analysis file
  const dataDir = join(process.cwd(), 'data');
  
  try {
    const files = readdirSync(dataDir).filter(file => file.startsWith('analysis_') && file.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('❌ No analysis files found. Run npm run analyze:efficient first.');
      return;
    }

    // Get the most recent file
    const latestFile = join(dataDir, files.sort().pop()!);
    console.log(`📄 Analyzing file: ${latestFile.split('/').pop()}`);
    
    const rawData = readFileSync(latestFile, 'utf8');
    const data: AnalysisData = JSON.parse(rawData);

    console.log(`📊 Simulation Overview:`);
    console.log(`   Total Simulations: ${data.overview.total_simulations}`);
    console.log(`   Total Participants: ${data.overview.total_participants}`);
    console.log(`   Total Wins: ${data.overview.total_wins}`);
    console.log(`   Avg Wins per Simulation: ${data.overview.avg_wins_per_simulation}`);

    // Question 1: Did any users with 0 tickets win?
    console.log('\n🎯 QUESTION 1: Did any users with 0 tickets win?');
    const zeroTicketWinners = data.win_rates.filter(user => user.avg_tickets === 0 && user.win_count > 0);
    
    if (zeroTicketWinners.length > 0) {
      console.log(`❌ PROBLEM FOUND: ${zeroTicketWinners.length} users with 0 tickets won!`);
      zeroTicketWinners.forEach(user => {
        console.log(`   - ${user.username}: ${user.win_count} wins (${user.avg_points} points, ${user.avg_tickets} tickets)`);
      });
    } else {
      console.log('✅ CORRECT: No users with 0 tickets won any rounds');
    }

    // Question 2: Did any users with 1 ticket win?
    console.log('\n🎯 QUESTION 2: Did any users with 1 ticket win?');
    const oneTicketWinners = data.win_rates.filter(user => user.avg_tickets === 1 && user.win_count > 0);
    
    if (oneTicketWinners.length > 0) {
      console.log(`✅ YES: ${oneTicketWinners.length} users with 1 ticket won at least once`);
      
      // Show top 10 one-ticket winners
      const topOneTicketWinners = oneTicketWinners
        .sort((a, b) => b.win_count - a.win_count)
        .slice(0, 10);
      
      console.log('   Top 1-ticket winners:');
      topOneTicketWinners.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username}: ${user.win_count} wins (${user.avg_points} points, ${(user.win_rate * 100).toFixed(2)}% win rate)`);
      });
    } else {
      console.log('❌ NO: No users with exactly 1 ticket won any rounds');
    }

    // Question 3: Did any users win 2 or more rounds?
    console.log('\n🎯 QUESTION 3: Did any users win 2 or more rounds?');
    const multiRoundWinners = data.win_rates.filter(user => user.win_count >= 2);
    
    if (multiRoundWinners.length > 0) {
      console.log(`✅ YES: ${multiRoundWinners.length} users won 2 or more rounds`);
      
      // Show top multi-round winners
      const topMultiWinners = multiRoundWinners
        .sort((a, b) => b.win_count - a.win_count)
        .slice(0, 20);
      
      console.log('   Top multi-round winners:');
      topMultiWinners.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username}: ${user.win_count} wins (${user.avg_tickets} tickets, ${(user.win_rate * 100).toFixed(2)}% win rate)`);
      });
      
      // Statistics about multi-round winners
      const maxWins = Math.max(...multiRoundWinners.map(u => u.win_count));
      const avgWinsMulti = multiRoundWinners.reduce((sum, u) => sum + u.win_count, 0) / multiRoundWinners.length;
      
      console.log(`\n   📈 Multi-round winner statistics:`);
      console.log(`      Maximum wins by single user: ${maxWins}`);
      console.log(`      Average wins among multi-winners: ${avgWinsMulti.toFixed(2)}`);
      console.log(`      Users with 5+ wins: ${multiRoundWinners.filter(u => u.win_count >= 5).length}`);
      console.log(`      Users with 10+ wins: ${multiRoundWinners.filter(u => u.win_count >= 10).length}`);
      console.log(`      Users with 20+ wins: ${multiRoundWinners.filter(u => u.win_count >= 20).length}`);
      
    } else {
      console.log('❌ NO: No users won 2 or more rounds (each user won at most 1 round)');
    }

    // Additional analysis: Ticket distribution among winners
    console.log('\n📊 ADDITIONAL ANALYSIS: Ticket Distribution Among Winners');
    
    const winners = data.win_rates.filter(user => user.win_count > 0);
    const ticketGroups = {
      '0 tickets': winners.filter(u => u.avg_tickets === 0),
      '1 ticket': winners.filter(u => u.avg_tickets === 1),
      '2-5 tickets': winners.filter(u => u.avg_tickets >= 2 && u.avg_tickets <= 5),
      '6-10 tickets': winners.filter(u => u.avg_tickets >= 6 && u.avg_tickets <= 10),
      '11-20 tickets': winners.filter(u => u.avg_tickets >= 11 && u.avg_tickets <= 20),
      '21+ tickets': winners.filter(u => u.avg_tickets >= 21)
    };

    Object.entries(ticketGroups).forEach(([range, users]) => {
      if (users.length > 0) {
        const totalWins = users.reduce((sum, u) => sum + u.win_count, 0);
        const avgWinRate = users.reduce((sum, u) => sum + u.win_rate, 0) / users.length;
        console.log(`   ${range}: ${users.length} users, ${totalWins} total wins, ${(avgWinRate * 100).toFixed(2)}% avg win rate`);
      }
    });

    // Check for statistical fairness
    console.log('\n🔍 STATISTICAL FAIRNESS CHECK');
    const totalWinners = winners.length;
    const totalNonWinners = data.overview.total_participants - totalWinners;
    
    console.log(`   Total participants: ${data.overview.total_participants}`);
    console.log(`   Users who won at least once: ${totalWinners} (${(totalWinners / data.overview.total_participants * 100).toFixed(1)}%)`);
    console.log(`   Users who never won: ${totalNonWinners} (${(totalNonWinners / data.overview.total_participants * 100).toFixed(1)}%)`);
    
    // Check engagement level distribution among winners
    const engagementWinners = {
      low: winners.filter(u => u.engagement_level === 'low'),
      medium: winners.filter(u => u.engagement_level === 'medium'),
      high: winners.filter(u => u.engagement_level === 'high'),
      power: winners.filter(u => u.engagement_level === 'power')
    };

    console.log('\n📈 ENGAGEMENT LEVEL AMONG WINNERS');
    Object.entries(engagementWinners).forEach(([level, users]) => {
      if (users.length > 0) {
        const totalWins = users.reduce((sum, u) => sum + u.win_count, 0);
        const avgTickets = users.reduce((sum, u) => sum + u.avg_tickets, 0) / users.length;
        console.log(`   ${level.toUpperCase()}: ${users.length} winners, ${totalWins} total wins, ${avgTickets.toFixed(1)} avg tickets`);
      }
    });

    console.log('\n' + '=' .repeat(50));
    console.log('✅ ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error analyzing simulation data:', error);
  }
}

// Run analysis
if (require.main === module) {
  analyzeLastSimulation().catch(console.error);
}

export { analyzeLastSimulation };