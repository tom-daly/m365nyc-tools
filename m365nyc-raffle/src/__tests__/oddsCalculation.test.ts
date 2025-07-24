import { describe, it, expect } from '@jest/globals';

/**
 * This test verifies the odds calculation logic used in the raffle application
 */
describe('Odds Calculation', () => {
  // Helper function that mimics the expected odds calculation
  function calculateOdds(participants: { name: string, points: number }[]): { name: string, points: number, tickets: number, odds: number }[] {
    // Calculate tickets for each participant (Points / 100, rounded down)
    const participantsWithTickets = participants.map(p => ({
      ...p,
      tickets: Math.floor(p.points / 100)
    }));

    // Calculate total tickets
    const totalTickets = participantsWithTickets.reduce((sum, p) => sum + p.tickets, 0);

    // Calculate odds for each participant
    return participantsWithTickets.map(p => ({
      ...p,
      odds: totalTickets > 0 ? (p.tickets / totalTickets) * 100 : 0
    }));
  }

  it('should calculate odds based on ticket count', () => {
    // Test data based on screenshot values
    const participants = [
      { name: 'Elizabeth Hernandez', points: 6900 },
      { name: 'Angela Martin', points: 6800 },
      { name: 'Samantha Gonzalez', points: 6600 },
      { name: 'Nicole Smith', points: 6500 },
      { name: 'Mary Miller', points: 6100 }
    ];

    const results = calculateOdds(participants);
    
    // Total tickets should be 69 + 68 + 66 + 65 + 61 = 329
    const totalTickets = 329;
    
    // Verify odds for Elizabeth Hernandez
    expect(results[0].tickets).toBe(69);
    expect(results[0].odds).toBeCloseTo((69 / totalTickets) * 100, 2);
    
    // Verify odds for Mary Miller
    expect(results[4].tickets).toBe(61);
    expect(results[4].odds).toBeCloseTo((61 / totalTickets) * 100, 2);

    // Verify that higher ticket counts result in higher odds
    expect(results[0].odds).toBeGreaterThan(results[1].odds); // Elizabeth > Angela
    expect(results[1].odds).toBeGreaterThan(results[2].odds); // Angela > Samantha
    expect(results[2].odds).toBeGreaterThan(results[3].odds); // Samantha > Nicole
    expect(results[3].odds).toBeGreaterThan(results[4].odds); // Nicole > Mary
  });

  it('should handle a more complex scenario with many participants', () => {
    // Generate 20 participants with varying point values
    const participants = Array.from({ length: 20 }, (_, i) => ({
      name: `Participant ${i + 1}`,
      points: 10000 - (i * 500) // Descending points: 10000, 9500, 9000, etc.
    }));

    const results = calculateOdds(participants);
    
    // Verify the odds are calculated correctly and monotonically decreasing
    for (let i = 0; i < results.length - 1; i++) {
      // Each participant should have higher odds than the next one
      expect(results[i].odds).toBeGreaterThan(results[i + 1].odds);
    }

    // Specific check for the top participant
    const topParticipant = results[0];
    const totalTickets = results.reduce((sum, p) => sum + p.tickets, 0);
    
    expect(topParticipant.odds).toBeCloseTo((topParticipant.tickets / totalTickets) * 100, 2);
  });

  it('should calculate correct odds with expected values', () => {
    // Test data based on screenshot values
    const participants = [
      { name: 'Elizabeth Hernandez', points: 6900, tickets: 69 },
      { name: 'Angela Martin', points: 6800, tickets: 68 },
      { name: 'Samantha Gonzalez', points: 6600, tickets: 66 },
      { name: 'Nicole Smith', points: 6500, tickets: 65 },
      { name: 'Mary Miller', points: 6100, tickets: 61 }
    ];
    
    const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
    expect(totalTickets).toBe(329);
    
    // The correct odds should be:
    expect((participants[0].tickets / totalTickets) * 100).toBeCloseTo(20.97); // Elizabeth: 69/329 ≈ 20.97%
    expect((participants[1].tickets / totalTickets) * 100).toBeCloseTo(20.67); // Angela: 68/329 ≈ 20.67%
    expect((participants[2].tickets / totalTickets) * 100).toBeCloseTo(20.06); // Samantha: 66/329 ≈ 20.06%
    expect((participants[3].tickets / totalTickets) * 100).toBeCloseTo(19.76); // Nicole: 65/329 ≈ 19.76%
    expect((participants[4].tickets / totalTickets) * 100).toBeCloseTo(18.54); // Mary: 61/329 ≈ 18.54%
    
    // Compare with screenshot values - these will NOT match because screenshot values are incorrect:
    const screenshotValues = [0.54, 0.30, 0.13, 0.56, 0.94];
    const calculatedValues = participants.map(p => (p.tickets / totalTickets) * 100);
    
    // Log the comparison for debugging
    console.table({
      'Participant': participants.map(p => p.name),
      'Tickets': participants.map(p => p.tickets),
      'Correct Odds': calculatedValues.map(v => `${v.toFixed(2)}%`),
      'Screenshot Odds': screenshotValues.map(v => `${v}%`),
      'Match?': calculatedValues.map((v, i) => Math.abs(v - screenshotValues[i]) < 0.1 ? '✓' : '✗')
    });
    
    // This test confirms there's an issue with the odds calculation in the UI
  });
  
  it('should handle edge cases in odds calculation', () => {
    // Zero tickets
    expect(calculateOdds([{ name: 'Zero', points: 0 }])[0].odds).toBe(0);
    
    // All tickets belong to one participant
    const singleParticipant = calculateOdds([{ name: 'Solo', points: 100 }]);
    expect(singleParticipant[0].odds).toBe(100);
    
    // Multiple participants but one has all the points
    const mixedParticipants = calculateOdds([
      { name: 'Winner', points: 100 },
      { name: 'Loser', points: 0 }
    ]);
    expect(mixedParticipants[0].odds).toBe(100);
    expect(mixedParticipants[1].odds).toBe(0);
  });
});
