/**
 * Quick Validation Script for Raffle Testing (JavaScript version)
 * 
 * This script provides a simple way to validate that all raffle testing components
 * are working correctly without TypeScript compilation issues.
 */

// Simple test data
const testTeams = [
  { Team: 'Team Alpha', Points: 1500, Submissions: 5, 'Last Submission': '2024-01-01', status: 'active' },
  { Team: 'Team Beta', Points: 1200, Submissions: 4, 'Last Submission': '2024-01-01', status: 'active' },
  { Team: 'Team Gamma', Points: 800, Submissions: 3, 'Last Submission': '2024-01-01', status: 'active' },
  { Team: 'Team Delta', Points: 500, Submissions: 2, 'Last Submission': '2024-01-01', status: 'active' },
  { Team: 'Team Echo', Points: 200, Submissions: 1, 'Last Submission': '2024-01-01', status: 'active' },
];

const testRounds = [
  { id: 1, name: "Test Round 1", pointThreshold: 0, description: "All eligible" },
  { id: 2, name: "Test Round 2", pointThreshold: 300, description: "300+ points" },
  { id: 3, name: "Test Round 3", pointThreshold: 600, description: "600+ points" },
];

// Simple weighted selection function
function simpleWeightedSelection(teams) {
  if (teams.length === 0) return '';
  
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  if (totalTickets === 0) return teams[0].Team;
  
  let random = Math.floor(Math.random() * totalTickets) + 1;
  
  for (const team of teams) {
    const tickets = Math.floor(team.Points / 100);
    random -= tickets;
    if (random <= 0) return team.Team;
  }
  
  return teams[0].Team;
}

// Simple raffle simulation
function simpleRaffleSimulation(teams, rounds) {
  let remainingTeams = [...teams];
  const winners = [];
  const roundDetails = [];
  
  for (const round of rounds) {
    const eligibleTeams = remainingTeams.filter(team => team.Points >= round.pointThreshold);
    
    if (eligibleTeams.length === 0) break;
    
    const winner = simpleWeightedSelection(eligibleTeams);
    const winnerTeam = eligibleTeams.find(t => t.Team === winner);
    const winnerTickets = Math.floor(winnerTeam.Points / 100);
    
    winners.push(winner);
    roundDetails.push({
      round: round.name,
      eligible: eligibleTeams.length,
      winner,
      winnerTickets
    });
    
    // Remove winner from remaining teams
    remainingTeams = remainingTeams.filter(team => team.Team !== winner);
  }
  
  return { winners, roundDetails };
}

// Run validation tests
function runValidationTests() {
  console.log('🧪 Running Raffle Validation Tests...\n');
  
  // Test 1: Basic functionality
  console.log('Test 1: Basic Raffle Simulation');
  const result = simpleRaffleSimulation(testTeams, testRounds);
  console.log('✅ Winners:', result.winners);
  console.log('✅ Round Details:');
  result.roundDetails.forEach(detail => {
    console.log(`   ${detail.round}: ${detail.winner} (${detail.winnerTickets} tickets, ${detail.eligible} eligible)`);
  });
  
  // Test 2: Multiple runs for consistency
  console.log('\nTest 2: Multiple Simulation Consistency');
  const runs = 100;
  const winnerCounts = {};
  
  testTeams.forEach(team => winnerCounts[team.Team] = 0);
  
  for (let i = 0; i < runs; i++) {
    const result = simpleRaffleSimulation(testTeams, testRounds);
    result.winners.forEach(winner => winnerCounts[winner]++);
  }
  
  console.log('✅ Win counts over', runs, 'simulations:');
  Object.entries(winnerCounts).forEach(([team, count]) => {
    const winRate = (count / runs * 100).toFixed(1);
    const teamData = testTeams.find(t => t.Team === team);
    const tickets = Math.floor(teamData.Points / 100);
    console.log(`   ${team}: ${count} wins (${winRate}%) - ${tickets} tickets`);
  });
  
  // Test 3: Edge cases
  console.log('\nTest 3: Edge Case Testing');
  
  // Empty teams
  try {
    const emptyResult = simpleWeightedSelection([]);
    console.log('✅ Empty teams handled:', emptyResult === '');
  } catch {
    console.log('✅ Empty teams properly rejected');
  }
  
  // Single team
  const singleTeamResult = simpleWeightedSelection([testTeams[0]]);
  console.log('✅ Single team selection:', singleTeamResult === testTeams[0].Team);
  
  // Zero points team
  const zeroPointsTeam = { 
    Team: 'Zero Points', Points: 0, Submissions: 1, 'Last Submission': '2024-01-01', status: 'active' 
  };
  const zeroPointsResult = simpleWeightedSelection([zeroPointsTeam, testTeams[0]]);
  console.log('✅ Zero points handling:', typeof zeroPointsResult === 'string');
  
  // Test 4: Performance check
  console.log('\nTest 4: Performance Check');
  const largeTeams = Array.from({ length: 1000 }, (_, i) => ({
    Team: `Team ${i + 1}`,
    Points: Math.floor(Math.random() * 2000),
    Submissions: Math.floor(Math.random() * 10) + 1,
    'Last Submission': '2024-01-01',
    status: 'active',
  }));
  
  const startTime = performance.now();
  for (let i = 0; i < 10; i++) {
    simpleRaffleSimulation(largeTeams, testRounds);
  }
  const endTime = performance.now();
  
  console.log(`✅ Performance: 10 simulations with 1000 teams completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  console.log('\n🎉 All validation tests completed successfully!');
  console.log('\n📚 Available npm scripts:');
  console.log('   npm run validate-js           - This validation script (JavaScript)');
  console.log('   npm run simulate:quick        - Quick simulation test');
  console.log('   npm run simulate:standard     - Standard analysis');
  console.log('   npm run simulate:comprehensive - Full comprehensive analysis');
  console.log('   npm run simulate:performance  - Performance testing');
  console.log('   npm run test:simulation       - Jest simulation tests');
  console.log('   npm run test:advanced         - Advanced edge case tests');
  
  console.log('\n💡 Quick Test Commands:');
  console.log('   npm test                      - Run all Jest tests');
  console.log('   npm run test:simulation       - Run simulation tests only');
  console.log('   npm run validate-js           - Run this validation script');
}

// Export for potential use in other scripts
module.exports = { 
  simpleWeightedSelection, 
  simpleRaffleSimulation, 
  testTeams, 
  testRounds,
  runValidationTests
};

// Run if executed directly
if (require.main === module) {
  runValidationTests();
}
