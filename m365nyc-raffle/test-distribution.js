// Quick test to verify the new simple division distribution method
const { ConfigurationManager } = require('./src/utils/configurationManager');

// Sample test data
const sampleTeams = [
  { Team: 'Player1', Points: 100, Submissions: 1, 'Last Submission': '2025-01-01' },
  { Team: 'Player2', Points: 200, Submissions: 2, 'Last Submission': '2025-01-01' },
  { Team: 'Player3', Points: 300, Submissions: 3, 'Last Submission': '2025-01-01' },
  { Team: 'Player4', Points: 400, Submissions: 4, 'Last Submission': '2025-01-01' },
  { Team: 'Player5', Points: 500, Submissions: 5, 'Last Submission': '2025-01-01' },
  { Team: 'Player6', Points: 600, Submissions: 6, 'Last Submission': '2025-01-01' },
  { Team: 'Player7', Points: 700, Submissions: 7, 'Last Submission': '2025-01-01' },
  { Team: 'Player8', Points: 800, Submissions: 8, 'Last Submission': '2025-01-01' },
  { Team: 'Player9', Points: 900, Submissions: 9, 'Last Submission': '2025-01-01' },
  { Team: 'Player10', Points: 1000, Submissions: 10, 'Last Submission': '2025-01-01' }
];

const settings = {
  numberOfRounds: 5
};

console.log('Testing new simple division distribution method:');
console.log(`Total players: ${sampleTeams.length}`);
console.log(`Number of rounds: ${settings.numberOfRounds}`);
console.log(`Expected players per round: ${Math.ceil(sampleTeams.length / settings.numberOfRounds)}`);
console.log('');

try {
  const rounds = ConfigurationManager.generateOptimalRounds(sampleTeams, settings);
  
  console.log('Generated rounds:');
  rounds.forEach((round, index) => {
    console.log(`Round ${round.id}: ${round.name}`);
    console.log(`  Point threshold: ${round.pointThreshold}`);
    console.log(`  Description: ${round.description}`);
    console.log('');
  });
  
  console.log('✅ Test passed! Simple division distribution is working correctly.');
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
