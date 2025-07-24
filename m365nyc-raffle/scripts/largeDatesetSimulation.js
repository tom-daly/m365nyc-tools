/**
 * Large Dataset Raffle Simulation - 200 Users
 * 
 * This script generates a realistic dataset of 200 conference speakers/attendees
 * with varied points and submissions, then runs detailed raffle simulations
 * showing complete winner lists and analysis.
 */

 
const fs = require('fs');
 
const path = require('path');

// === NEW: CSV parsing utility ===
// Parse CSV file for participant data
function parseCSVFile(filePath) {
  const csv = fs.readFileSync(filePath, 'utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',');
  const participants = [];
  let participantId = 1;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < 4) continue; // skip incomplete rows
    const [Team, Points, Submissions, LastSubmission] = row;
    participants.push({
      Team: Team.replace(/^"|"$/g, ''),
      Points: Number(Points),
      Submissions: Number(Submissions),
      LastSubmission: LastSubmission,
      status: 'active',
      category: 'Imported',
      id: participantId++
    });
  }
  // Sort by points (highest first) for easier analysis
  participants.sort((a, b) => b.Points - a.Points);
  return participants;
}

// Generate realistic speaker/attendee names
const firstNames = [
  'Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Avery', 'Riley', 'Cameron', 'Quinn', 'Sage',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson',
  'Ella', 'Levi', 'Madison', 'Sebastian', 'Scarlett', 'Mateo', 'Victoria', 'Jack', 'Aria', 'Owen',
  'Grace', 'Theodore', 'Chloe', 'Aiden', 'Camila', 'Samuel', 'Penelope', 'Joseph', 'Layla', 'John',
  'Riley', 'David', 'Zoey', 'Wyatt', 'Nora', 'Matthew', 'Lily', 'Luke', 'Eleanor', 'Asher',
  'Hannah', 'Carter', 'Lillian', 'Julian', 'Addison', 'Grayson', 'Aubrey', 'Leo', 'Ellie', 'Jayden',
  'Stella', 'Gabriel', 'Natalie', 'Isaac', 'Zoe', 'Oliver', 'Leah', 'Jonathan', 'Hazel', 'Ezra',
  'Violet', 'Aaron', 'Aurora', 'Eli', 'Savannah', 'Andrew', 'Audrey', 'Joshua', 'Brooklyn', 'Nathan'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'AdAMS', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes'
];

// Generate 200 realistic participants
function generateLargeDataset() {
  const participants = [];
  const usedNames = new Set();
  
  // Different participant categories with realistic distributions
  const categories = [
    { name: 'Casual Attendees', count: 80, pointsRange: [50, 400], submissionsRange: [1, 3] },
    { name: 'Active Participants', count: 70, pointsRange: [300, 800], submissionsRange: [2, 6] },
    { name: 'Engaged Speakers', count: 35, pointsRange: [600, 1200], submissionsRange: [4, 8] },
    { name: 'Super Contributors', count: 15, pointsRange: [1000, 2000], submissionsRange: [6, 12] }
  ];
  
  let participantId = 1;
  
  categories.forEach(category => {
    console.log(`Generating ${category.count} ${category.name}...`);
    
    for (let i = 0; i < category.count; i++) {
      let fullName;
      do {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));
      
      usedNames.add(fullName);
      
      // Generate points within category range with some randomness
      const [minPoints, maxPoints] = category.pointsRange;
      const points = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
      
      // Generate submissions correlated with points but with variation
      const [minSubs, maxSubs] = category.submissionsRange;
      const baseSubmissions = Math.floor(Math.random() * (maxSubs - minSubs + 1)) + minSubs;
      
      // Add some correlation between points and submissions
      const pointsBonus = Math.floor(points / 200);
      const submissions = Math.max(1, baseSubmissions + Math.floor(Math.random() * pointsBonus));
      
      participants.push({
        Team: fullName,
        Points: points,
        Submissions: submissions,
        'Last Submission': '2024-01-01',
        status: 'active',
        category: category.name,
        id: participantId++
      });
    }
  });
  
  // Sort by points (highest first) for easier analysis
  participants.sort((a, b) => b.Points - a.Points);
  
  return participants;
}

// Raffle rounds configuration
const raffleRounds = [
  {
    id: 1,
    name: "Opening Round - All Welcome",
    pointThreshold: 0,
    description: "Everyone can participate"
  },
  {
    id: 2,
    name: "Active Participants Round",
    pointThreshold: 200,
    description: "Participants with 200+ points"
  },
  {
    id: 3,
    name: "Engaged Members Round",
    pointThreshold: 500,
    description: "Members with 500+ points"
  },
  {
    id: 4,
    name: "Contributors Round",
    pointThreshold: 800,
    description: "Contributors with 800+ points"
  },
  {
    id: 5,
    name: "Elite Round",
    pointThreshold: 1200,
    description: "Elite members with 1200+ points"
  }
];

// Weighted selection function
function selectWeightedWinner(teams) {
  if (teams.length === 0) throw new Error('No teams available');
  
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  if (totalTickets === 0) {
    return teams[Math.floor(Math.random() * teams.length)];
  }
  
  let random = Math.floor(Math.random() * totalTickets) + 1;
  
  for (const team of teams) {
    const tickets = Math.floor(team.Points / 100);
    random -= tickets;
    if (random <= 0) {
      return team;
    }
  }
  
  return teams[0];
}

// Run detailed raffle simulation
function runDetailedRaffleSimulation(participants, rounds) {
  console.log('🎯 Starting detailed raffle simulation...\n');
  
  let remainingParticipants = [...participants];
  const allWinners = [];
  const roundResults = [];
  
  rounds.forEach((round) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎪 ${round.name} (Round ${round.id})`);
    console.log(`📋 ${round.description}`);
    console.log(`🎫 Minimum points required: ${round.pointThreshold}`);
    console.log(`${'='.repeat(60)}`);
    
    // Filter eligible participants
    const eligibleParticipants = remainingParticipants.filter(p => p.Points >= round.pointThreshold);
    
    console.log(`\n📊 Round ${round.id} Statistics:`);
    console.log(`   👥 Total remaining participants: ${remainingParticipants.length}`);
    console.log(`   ✅ Eligible for this round: ${eligibleParticipants.length}`);
    console.log(`   ❌ Eliminated by threshold: ${remainingParticipants.length - eligibleParticipants.length}`);
    
    if (eligibleParticipants.length === 0) {
      console.log(`   ⚠️  No eligible participants for this round. Ending raffle.`);
      return;
    }
    
    // Calculate total tickets
    const totalTickets = eligibleParticipants.reduce((sum, p) => sum + Math.floor(p.Points / 100), 0);
    console.log(`   🎫 Total tickets in play: ${totalTickets.toLocaleString()}`);
    
    // Show ticket distribution summary
    const ticketDistribution = {};
    eligibleParticipants.forEach(p => {
      const tickets = Math.floor(p.Points / 100);
      const range = tickets < 5 ? '1-4' : tickets < 10 ? '5-9' : tickets < 20 ? '10-19' : '20+';
      ticketDistribution[range] = (ticketDistribution[range] || 0) + 1;
    });
    
    console.log(`\n   🎫 Ticket Distribution:`);
    Object.entries(ticketDistribution).forEach(([range, count]) => {
      console.log(`      ${range} tickets: ${count} participants`);
    });
    
    // Select winner
    const winner = selectWeightedWinner(eligibleParticipants);
    const winnerTickets = Math.floor(winner.Points / 100);
    const winChance = ((winnerTickets / totalTickets) * 100).toFixed(2);
    
    allWinners.push(winner);
    
    console.log(`\n🏆 WINNER: ${winner.Team}`);
    console.log(`   📈 Points: ${winner.Points.toLocaleString()}`);
    console.log(`   📝 Submissions: ${winner.Submissions}`);
    console.log(`   🎫 Tickets: ${winnerTickets}`);
    console.log(`   📊 Win probability: ${winChance}%`);
    console.log(`   🏷️  Category: ${winner.category}`);
    
    // Store round results
    roundResults.push({
      round: round.name,
      roundId: round.id,
      threshold: round.pointThreshold,
      totalRemaining: remainingParticipants.length,
      eligible: eligibleParticipants.length,
      eliminated: remainingParticipants.length - eligibleParticipants.length,
      totalTickets,
      winner: {
        name: winner.Team,
        points: winner.Points,
        submissions: winner.Submissions,
        tickets: winnerTickets,
        winChance: parseFloat(winChance),
        category: winner.category
      }
    });
    
    // Remove winner from remaining participants
    remainingParticipants = remainingParticipants.filter(p => p.id !== winner.id);
    
    console.log(`   ➡️  Participants remaining for next round: ${remainingParticipants.length}`);
  });
  
  return { winners: allWinners, roundResults, finalParticipants: remainingParticipants };
}

// Generate comprehensive analysis
function generateComprehensiveAnalysis(participants, results) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE RAFFLE ANALYSIS');
  console.log(`${'='.repeat(80)}`);
  
  // Dataset overview
  console.log('\n📋 Dataset Overview:');
  console.log(`   👥 Total participants: ${participants.length}`);
  
  const categoryStats = {};
  participants.forEach(p => {
    if (!categoryStats[p.category]) {
      categoryStats[p.category] = { count: 0, totalPoints: 0, totalSubmissions: 0 };
    }
    categoryStats[p.category].count++;
    categoryStats[p.category].totalPoints += p.Points;
    categoryStats[p.category].totalSubmissions += p.Submissions;
  });
  
  console.log('\n   📊 By Category:');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const avgPoints = Math.round(stats.totalPoints / stats.count);
    const avgSubmissions = Math.round(stats.totalSubmissions / stats.count);
    console.log(`      ${category}: ${stats.count} people (avg: ${avgPoints} pts, ${avgSubmissions} subs)`);
  });
  
  // Point distribution
  const pointRanges = {
    '0-199': 0, '200-499': 0, '500-799': 0, '800-1199': 0, '1200+': 0
  };
  participants.forEach(p => {
    if (p.Points < 200) pointRanges['0-199']++;
    else if (p.Points < 500) pointRanges['200-499']++;
    else if (p.Points < 800) pointRanges['500-799']++;
    else if (p.Points < 1200) pointRanges['800-1199']++;
    else pointRanges['1200+']++;
  });
  
  console.log('\n   📈 Point Distribution:');
  Object.entries(pointRanges).forEach(([range, count]) => {
    const percentage = ((count / participants.length) * 100).toFixed(1);
    console.log(`      ${range} points: ${count} people (${percentage}%)`);
  });
  
  // Winner analysis
  console.log('\n🏆 Winner Analysis:');
  results.winners.forEach((winner, index) => {
    const round = results.roundResults[index];
    console.log(`\n   Round ${round.roundId}: ${winner.Team}`);
    console.log(`      Category: ${winner.category}`);
    console.log(`      Points: ${winner.Points} | Submissions: ${winner.Submissions} | Tickets: ${Math.floor(winner.Points / 100)}`);
    console.log(`      Win chance: ${round.winner.winChance}% | Eligible: ${round.eligible} participants`);
  });
  
  // Category success analysis
  const categoryWins = {};
  results.winners.forEach(winner => {
    categoryWins[winner.category] = (categoryWins[winner.category] || 0) + 1;
  });
  
  console.log('\n📊 Wins by Category:');
  Object.entries(categoryWins).forEach(([category, wins]) => {
    const categoryCount = categoryStats[category].count;
    const winRate = ((wins / categoryCount) * 100).toFixed(1);
    console.log(`   ${category}: ${wins} wins out of ${categoryCount} people (${winRate}% success rate)`);
  });
  
  // Fairness analysis
  console.log('\n⚖️ Fairness Analysis:');
  const totalTicketsAtStart = participants.reduce((sum, p) => sum + Math.floor(p.Points / 100), 0);
  const averageTickets = totalTicketsAtStart / participants.length;
  
  console.log(`   🎫 Total tickets at start: ${totalTicketsAtStart.toLocaleString()}`);
  console.log(`   📊 Average tickets per person: ${averageTickets.toFixed(1)}`);
  
  let highTicketWins = 0;
  results.winners.forEach(winner => {
    const winnerTickets = Math.floor(winner.Points / 100);
    if (winnerTickets > averageTickets) highTicketWins++;
  });
  
  console.log(`   🎯 Winners with above-average tickets: ${highTicketWins}/${results.winners.length} (${((highTicketWins / results.winners.length) * 100).toFixed(1)}%)`);
  
  // Round progression
  console.log('\n📈 Round Progression:');
  results.roundResults.forEach(round => {
    const eliminationRate = ((round.eliminated / round.totalRemaining) * 100).toFixed(1);
    console.log(`   Round ${round.roundId}: ${round.totalRemaining} → ${round.eligible} eligible (${eliminationRate}% eliminated)`);
  });
}

// Save results to files
function saveResults(participants, results) {
  const outputDir = 'simulation-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Save participant data
  const participantFile = path.join(outputDir, `participants-${timestamp}.json`);
  fs.writeFileSync(participantFile, JSON.stringify(participants, null, 2));
  
  // Save results
  const resultsFile = path.join(outputDir, `raffle-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Save CSV for Excel analysis
  const csvData = participants.map(p => ({
    Name: p.Team,
    Points: p.Points,
    Submissions: p.Submissions,
    Category: p.category,
    Tickets: Math.floor(p.Points / 100),
    Winner: results.winners.some(w => w.id === p.id) ? 'YES' : 'NO'
  }));
  
  const csvContent = [
    'Name,Points,Submissions,Category,Tickets,Winner',
    ...csvData.map(row => `"${row.Name}",${row.Points},${row.Submissions},"${row.Category}",${row.Tickets},${row.Winner}`)
  ].join('\n');
  
  const csvFile = path.join(outputDir, `analysis-${timestamp}.csv`);
  fs.writeFileSync(csvFile, csvContent);
  
  console.log(`\n💾 Results saved to:`);
  console.log(`   📋 Participants: ${participantFile}`);
  console.log(`   🏆 Results: ${resultsFile}`);
  console.log(`   📊 CSV Analysis: ${csvFile}`);
}

// Generate 15 rounds based on CSV point range
function generateFifteenRounds(participants) {
  const minPoints = Math.min(...participants.map(p => p.Points));
  const maxPoints = Math.max(...participants.map(p => p.Points));
  const step = (maxPoints - minPoints) / 15;
  const rounds = [];
  for (let i = 0; i < 15; i++) {
    const threshold = Math.round(minPoints + i * step);
    rounds.push({
      id: i + 1,
      name: `Round ${i + 1}`,
      pointThreshold: threshold,
      description: `Participants with ${threshold}+ points`
    });
  }
  return rounds;
}

// Main execution
function runLargeDatasetSimulation() {
  console.log('🚀 Generating Large Dataset Raffle Simulation (200 Participants)\n');

  // Check for --csv argument
  const csvArg = process.argv.find(arg => arg.startsWith('--csv='));
  let participants;
  if (csvArg) {
    const csvPath = csvArg.split('=')[1];
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      process.exit(1);
    }
    console.log(`📥 Loading participants from CSV: ${csvPath}`);
    participants = parseCSVFile(csvPath);
    // Assign a default category based on points (optional)
    participants.forEach(p => {
      if (p.Points >= 1200) p.category = 'Elite';
      else if (p.Points >= 800) p.category = 'Contributors';
      else if (p.Points >= 500) p.category = 'Engaged';
      else if (p.Points >= 200) p.category = 'Active';
      else p.category = 'Casual';
    });
  } else {
    // Generate participants
    participants = generateLargeDataset();
    console.log('\n✅ Generated 200 participants with realistic variation');
    console.log('📊 Dataset includes different engagement levels and point distributions');
  }

  // Run the raffle
  const results = runDetailedRaffleSimulation(participants, raffleRounds);

  // Generate analysis
  generateComprehensiveAnalysis(participants, results);

  // Save results
  saveResults(participants, results);

  console.log(`\n\n🎉 Large dataset simulation completed!`);
  console.log('📝 Check the simulation-results folder for detailed files');
  console.log('📊 Use the CSV file for additional analysis in Excel/Google Sheets');
}

// Run 15-round simulation with CSV
function runFifteenRoundSimulationWithCSV() {
  const csvArg = process.argv.find(arg => arg.startsWith('--csv='));
  if (!csvArg) {
    console.error('❌ Please provide a CSV file with --csv=path');
    process.exit(1);
  }
  const csvPath = csvArg.split('=')[1];
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  console.log(`📥 Loading participants from CSV: ${csvPath}`);
  const participants = parseCSVFile(csvPath);
  // Assign a default category based on points (optional)
  participants.forEach(p => {
    if (p.Points >= 1200) p.category = 'Elite';
    else if (p.Points >= 800) p.category = 'Contributors';
    else if (p.Points >= 500) p.category = 'Engaged';
    else if (p.Points >= 200) p.category = 'Active';
    else p.category = 'Casual';
  });
  const rounds = generateFifteenRounds(participants);
  const results = runDetailedRaffleSimulation(participants, rounds);
  generateComprehensiveAnalysis(participants, results);
  saveResults(participants, results);
  console.log(`\n\n🎉 15-round raffle simulation completed!`);
  console.log('📝 Check the simulation-results folder for detailed files');
  console.log('📊 Use the CSV file for additional analysis in Excel/Google Sheets');
}

// Run if executed directly
if (require.main === module) {
  // Always run 15-round simulation with CSV if --csv is provided
  const args = process.argv.slice(2);
  const csvFlag = args.find(arg => arg.startsWith('--csv='));
  if (csvFlag) {
    runFifteenRoundSimulationWithCSV();
  } else {
    runLargeDatasetSimulation();
  }
}

module.exports = {
  generateLargeDataset,
  runDetailedRaffleSimulation,
  generateComprehensiveAnalysis,
  raffleRounds
};
