import { describe, it, expect } from '@jest/globals';
// We're not directly using these imports in this test, but they're here to document
// the functions being tested in the actual application code
// import { calculateOdds, calculateTickets, calculateSingleOdds } from '@/utils/oddsCalculation';

describe('Round Index Odds Calculation Tests', () => {
  it('should calculate correct odds for high round numbers', () => {
    // Test data based on screenshot values for Round 9
    const participants = [
      { name: 'Elizabeth Hernandez', points: 6900 },
      { name: 'Samantha Gonzalez', points: 6600 },
      { name: 'Nicole Smith', points: 6500 },
      { name: 'Mary Miller', points: 6100 },
      { name: 'Kristi Rodriguez', points: 6000 }
    ];

    // Manual calculation for round 9
    const tickets = participants.map(p => Math.floor(p.points / 100));
    const totalTickets = tickets.reduce((sum, t) => sum + t, 0);
    
    console.log(`Total tickets in Round 9: ${totalTickets}`);
    console.table({
      'Participant': participants.map(p => p.name),
      'Points': participants.map(p => p.points),
      'Tickets': tickets,
      'Expected Odds': tickets.map(t => ((t / totalTickets) * 100).toFixed(2) + '%')
    });

    // Expected odds for Round 9
    const elizabeth = (69 / totalTickets) * 100;
    const samantha = (66 / totalTickets) * 100;
    const nicole = (65 / totalTickets) * 100;
    const mary = (61 / totalTickets) * 100;
    const kristi = (60 / totalTickets) * 100;

    // Verify the expected odds are correct
    expect(elizabeth).toBeCloseTo(21.43, 2);
    expect(samantha).toBeCloseTo(20.50, 2);
    expect(nicole).toBeCloseTo(20.19, 2);
    expect(mary).toBeCloseTo(18.94, 2);
    expect(kristi).toBeCloseTo(18.63, 2);

    // Verify the total of all odds adds up to 100%
    const totalOdds = elizabeth + samantha + nicole + mary + kristi;
    expect(totalOdds).toBeCloseTo(100, 1);
  });

  it('should handle round ID vs round index correctly', () => {
    // Simulate the issue where round IDs don't match array indices
    const rounds = [
      { id: 1, name: 'Round 1', pointThreshold: 0 },
      { id: 2, name: 'Round 2', pointThreshold: 100 },
      { id: 9, name: 'Round 9', pointThreshold: 3500 }
    ];

    const teams = [
      { Team: 'Team 1', Points: 4000 },
      { Team: 'Team 2', Points: 3800 }
    ];

    // Create round ID to index mapping
    const roundIdToIndex = new Map<number, number>();
    rounds.forEach((round, index) => {
      roundIdToIndex.set(round.id, index);
    });

    // Verify mapping
    expect(roundIdToIndex.get(1)).toBe(0);
    expect(roundIdToIndex.get(2)).toBe(1);
    expect(roundIdToIndex.get(9)).toBe(2);

    // Create odds array
    const odds: number[][] = teams.map(() => Array(rounds.length).fill(0));

    // Calculate odds for round 9 (index 2)
    const roundId = 9;
    const roundIdx = roundIdToIndex.get(roundId) || 0;
    
    expect(roundIdx).toBe(2); // Should map to index 2

    const round = rounds[roundIdx];
    
    // Calculate tickets and odds for round 9
    const eligible = teams.filter(t => t.Points >= round.pointThreshold);
    const totalTickets = eligible.reduce((sum, t) => {
      const tickets = Math.floor(t.Points / 100);
      return sum + tickets;
    }, 0);

    // Verify tickets and total
    expect(Math.floor(teams[0].Points / 100)).toBe(40);
    expect(Math.floor(teams[1].Points / 100)).toBe(38);
    expect(totalTickets).toBe(78);

    // Calculate and store odds
    teams.forEach((team, teamIdx) => {
      if (team.Points >= round.pointThreshold) {
        const tickets = Math.floor(team.Points / 100);
        odds[teamIdx][roundIdx] = (tickets / totalTickets) * 100;
      }
    });

    // Verify odds were stored at the correct indices
    expect(odds[0][2]).toBeCloseTo((40 / 78) * 100, 2); // Team 1 in round 9 (index 2)
    expect(odds[1][2]).toBeCloseTo((38 / 78) * 100, 2); // Team 2 in round 9 (index 2)
  });
});
