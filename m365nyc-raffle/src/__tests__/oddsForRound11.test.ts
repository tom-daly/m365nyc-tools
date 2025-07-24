import { describe, it, expect } from '@jest/globals';
import { calculateOdds, calculateTickets, calculateSingleOdds } from '@/utils/oddsCalculation';

describe('Round 11 Odds Calculation Bug', () => {
  it('should calculate proper odds for Round 11 participants', () => {
    // Based on the screenshot data for Round 11
    const participants = [
      { name: 'Elizabeth Hernandez', points: 6900 },
      { name: 'Angela Martin', points: 6800 },
      { name: 'Samantha Gonzalez', points: 6600 },
      { name: 'Nicole Smith', points: 6500 },
      { name: 'Mary Miller', points: 6100 }
    ];

    // Manual calculation of tickets and odds
    const tickets = participants.map(p => Math.floor(p.points / 100));
    const totalTickets = tickets.reduce((sum, t) => sum + t, 0);
    
    console.log(`Total tickets in play: ${totalTickets}`);
    console.table({
      'Participant': participants.map(p => p.name),
      'Points': participants.map(p => p.points),
      'Tickets': tickets,
      'Expected Odds': tickets.map(t => ((t / totalTickets) * 100).toFixed(2) + '%')
    });

    // Using the utility functions
    const participantsWithOdds = calculateOdds(participants);
    
    // Log the calculations from the utility
    console.table({
      'Participant': participantsWithOdds.map(p => p.name),
      'Points': participantsWithOdds.map(p => p.points),
      'Tickets (Calculated)': participantsWithOdds.map(p => p.tickets),
      'Calculated Odds': participantsWithOdds.map(p => p.odds.toFixed(2) + '%')
    });

    // Verify Elizabeth's odds (should be around 20.97%)
    expect(participantsWithOdds[0].tickets).toBe(69);
    expect(participantsWithOdds[0].odds).toBeCloseTo((69 / totalTickets) * 100, 2);
  });

  it('should handle ticket calculation for high-point participants correctly', () => {
    // Make sure ticket calculation is correct
    expect(calculateTickets(6900)).toBe(69);
    expect(calculateTickets(6800)).toBe(68);
    expect(calculateTickets(6600)).toBe(66);
    
    // Make sure single odds calculation is correct
    const totalTickets = 329; // 69 + 68 + 66 + 65 + 61
    
    expect(calculateSingleOdds(69, totalTickets)).toBeCloseTo(20.97, 2);
    expect(calculateSingleOdds(68, totalTickets)).toBeCloseTo(20.67, 2);
  });

  it('should simulate the page.tsx odds calculation logic', () => {
    // Simulate how the odds are calculated in page.tsx
    const teams = [
      { name: 'Elizabeth Hernandez', Points: 6900 },
      { name: 'Angela Martin', Points: 6800 },
      { name: 'Samantha Gonzalez', Points: 6600 },
      { name: 'Nicole Smith', Points: 6500 },
      { name: 'Mary Miller', Points: 6100 }
    ];
    
    const rounds = [
      { id: 11, name: 'Round 11', pointThreshold: 6000, description: 'Final round' }
    ];

    // Initialize odds array (team index -> round index -> odds)
    const odds: number[][] = teams.map(() => Array(rounds.length).fill(0));
    
    rounds.forEach((round, roundIdx) => {
      // Filter eligible teams based on point threshold
      const eligible = teams.filter(t => t.Points >= round.pointThreshold);
      
      // Calculate total tickets for this round
      const totalTickets = eligible.reduce((sum, t) => {
        const tickets = Math.floor(t.Points / 100);
        return sum + tickets;
      }, 0);
      
      console.log(`Round ${round.id} - Total tickets: ${totalTickets}`);
      console.log(`Eligible teams: ${eligible.length} out of ${teams.length}`);

      // Calculate odds for each team
      teams.forEach((team, teamIdx) => {
        if (team.Points >= round.pointThreshold) {
          const tickets = Math.floor(team.Points / 100);
          odds[teamIdx][roundIdx] = (tickets / totalTickets) * 100;
          
          console.log(`${team.name}: ${tickets} tickets, odds = ${odds[teamIdx][roundIdx].toFixed(2)}%`);
        } else {
          odds[teamIdx][roundIdx] = 0;
          console.log(`${team.name}: Not eligible, odds = 0%`);
        }
      });
    });

    // Verify the odds are calculated correctly
    expect(odds[0][0]).toBeCloseTo(20.97, 2); // Elizabeth
    expect(odds[1][0]).toBeCloseTo(20.67, 2); // Angela
    expect(odds[2][0]).toBeCloseTo(20.06, 2); // Samantha
    expect(odds[3][0]).toBeCloseTo(19.76, 2); // Nicole
    expect(odds[4][0]).toBeCloseTo(18.54, 2); // Mary
  });
});
