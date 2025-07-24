// Test script to debug ticket distribution chart issue
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Read the CSV file that contains participants 192-200
const csvPath = path.join(__dirname, '..', 'simulation-results', 'analysis-2025-07-10T06-08-52-144Z.csv');

if (fs.existsSync(csvPath)) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Papa = require('papaparse');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log('🔍 Debugging Ticket Distribution Issue');
      console.log('=====================================\n');
      
      // Convert to team data format
      const teams = results.data.map((row, index) => ({
        Team: row.Name,
        Points: parseInt(row.Points, 10) || 0,
        Submissions: parseInt(row.Submissions, 10) || 0,
        'Last Submission': '2024-01-01',
        status: 'active',
        rowNumber: index + 2 // +2 because CSV has header and is 1-indexed
      }));
      
      console.log(`📊 Total participants: ${teams.length}`);
      console.log(`🎯 Focusing on participants 192-200 (rows 192-200 in CSV)\n`);
      
      // Look at participants 192-200 (which are array indices 190-198)
      const participantsOfInterest = teams.slice(190, 199);
      
      console.log('🔍 Participants 192-200 Details:');
      participantsOfInterest.forEach((team, index) => {
        const actualParticipantNumber = 192 + index;
        const tickets = Math.floor(team.Points / 100);
        console.log(`   ${actualParticipantNumber}. ${team.Team}: ${team.Points} points → ${tickets} ticket(s)`);
      });
      
      console.log('\n📈 Ticket Distribution Analysis:');
      
      // Calculate tickets for all teams
      const ticketCounts = teams.map(team => Math.floor(team.Points / 100));
      
      // Create frequency distribution (same logic as the chart)
      const ticketFrequency = new Map();
      ticketCounts.forEach(tickets => {
        ticketFrequency.set(tickets, (ticketFrequency.get(tickets) || 0) + 1);
      });
      
      console.log('\n🎫 Ticket Frequency Distribution:');
      Array.from(ticketFrequency.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([tickets, count]) => {
          console.log(`   ${tickets} ticket(s): ${count} participant(s)`);
        });
      
      // Check specifically for 1-ticket participants
      const oneTicketParticipants = teams.filter(team => Math.floor(team.Points / 100) === 1);
      console.log(`\n🎯 Participants with exactly 1 ticket: ${oneTicketParticipants.length}`);
      
      // Show some examples of 1-ticket participants
      console.log('\n📝 Examples of 1-ticket participants:');
      oneTicketParticipants.slice(0, 10).forEach((team) => {
        const participantNumber = teams.indexOf(team) + 1;
        console.log(`   ${participantNumber}. ${team.Team}: ${team.Points} points → 1 ticket`);
      });
      
      // Check if any participants have the same name as numbers 192-194
      console.log('\n🔍 Checking for naming conflicts:');
      teams.forEach((team, index) => {
        const participantNumber = index + 1;
        if (participantNumber >= 192 && participantNumber <= 194) {
          console.log(`   Participant ${participantNumber}: ${team.Team} (${team.Points} points)`);
        }
      });
      
      console.log('\n✅ Analysis Complete');
      console.log('\n💡 If the chart shows participants 192, 193, 194 with multiple tickets,');
      console.log('   but they actually have 100 points each (1 ticket), there might be:');
      console.log('   1. A chart data processing bug');
      console.log('   2. A visualization rendering issue');
      console.log('   3. Confusion between participant numbers and ticket counts');
    }
  });
} else {
  console.log('❌ CSV file not found:', csvPath);
  console.log('Please ensure the simulation results file exists.');
}
