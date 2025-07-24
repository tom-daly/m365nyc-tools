// Test script to debug ticket distribution chart issue with the new CSV
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

// Read the new CSV file provided by the user
const csvPath = './200_Realistic_Users_Progressive_Raffle.csv';

if (fs.existsSync(csvPath)) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Papa = require('papaparse');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log('🔍 Debugging New CSV Ticket Distribution Issue');
      console.log('===============================================\n');
      
      // Convert to team data format
      const teams = results.data.map((row, index) => ({
        Team: row.Team,
        Points: parseInt(row.Points, 10) || 0,
        Submissions: parseInt(row.Submissions, 10) || 0,
        'Last Submission': row['Last Submission'],
        status: 'active',
        rowNumber: index + 2 // +2 because CSV has header and is 1-indexed
      }));
      
      console.log(`📊 Total participants: ${teams.length}`);
      console.log(`🎯 Focusing on participants 192-200 (rows 192-200 in CSV)\n`);
      
      // Look at participants 192-200 (which are array indices 191-199 for 0-indexed)
      const participantsOfInterest = teams.slice(191, 200);
      
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
      
      // Show examples of 1-ticket participants
      console.log('\n📝 Examples of 1-ticket participants:');
      oneTicketParticipants.forEach((team) => {
        const participantNumber = teams.indexOf(team) + 1;
        console.log(`   ${participantNumber}. ${team.Team}: ${team.Points} points → 1 ticket`);
      });
      
      // Check the specific participants 192-194 that were mentioned
      console.log('\n🔍 Detailed check of participants 192-194:');
      for (let i = 191; i <= 193; i++) { // indices 191-193 = participants 192-194
        if (teams[i]) {
          const participantNumber = i + 1;
          const tickets = Math.floor(teams[i].Points / 100);
          console.log(`   Participant ${participantNumber}: ${teams[i].Team}`);
          console.log(`     Points: ${teams[i].Points}`);
          console.log(`     Tickets: ${tickets}`);
          console.log(`     Expected: Should have 1 ticket if 100 points`);
          console.log('');
        }
      }
      
      // Summary of the issue
      console.log('✅ Analysis Complete');
      console.log('\n📋 Summary:');
      console.log('   - Total participants in CSV: ' + teams.length);
      console.log('   - Participants 192-200 ticket counts:');
      participantsOfInterest.forEach((team, index) => {
        const actualParticipantNumber = 192 + index;
        const tickets = Math.floor(team.Points / 100);
        console.log(`     ${actualParticipantNumber}: ${tickets} ticket(s) (${team.Points} points)`);
      });
      
      // Check if the issue is what was described
      const participants192to200 = teams.slice(191, 200);
      const allHave1Ticket = participants192to200.every(team => Math.floor(team.Points / 100) === 1);
      const participants192to194 = teams.slice(191, 194);
      const first3Have1Ticket = participants192to194.every(team => Math.floor(team.Points / 100) === 1);
      
      console.log('\n🎯 Issue Verification:');
      console.log(`   - Do participants 192-200 all have 1 ticket? ${allHave1Ticket ? 'YES' : 'NO'}`);
      console.log(`   - Do participants 192-194 all have 1 ticket? ${first3Have1Ticket ? 'YES' : 'NO'}`);
      
      if (!allHave1Ticket || !first3Have1Ticket) {
        console.log('\n❌ The data does NOT match the expected issue description.');
        console.log('   Some participants in the 192-200 range have more than 1 ticket.');
        console.log('   This explains why the chart shows multiple tickets for these participants.');
      } else {
        console.log('\n✅ The data MATCHES the issue description.');
        console.log('   All participants 192-200 should have 1 ticket, but chart shows otherwise.');
        console.log('   This indicates a potential bug in the chart logic.');
      }
    }
  });
} else {
  console.log('❌ CSV file not found:', csvPath);
  console.log('Please ensure the CSV file exists at the specified location.');
  console.log('You may need to update the csvPath variable with the correct path.');
}
