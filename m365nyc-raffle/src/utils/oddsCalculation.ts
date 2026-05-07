/**
 * Odds calculation utilities for the raffle application
 * 
 * IMPORTANT NOTE:
 * When using these utilities with the raffle app:
 * 1. Round IDs start at 1, but array indices start at 0
 * 2. When storing/accessing odds data, use the correct mapping:
 *    - For a round with ID X, use array index (X-1)
 *    - E.g., Round 9 data should be stored/accessed at index 8
 * 3. The odds array structure is: odds[teamIndex][roundIndex]
 */

type WithPoints = { Points?: number; points?: number };

const readPoints = (p: WithPoints): { points: number; defined: boolean } => {
  if (p.Points !== undefined) return { points: p.Points, defined: true };
  if (p.points !== undefined) return { points: p.points, defined: true };
  return { points: 0, defined: false };
};

/**
 * Calculate the odds of winning for each participant in a round
 *
 * @param participants Array of participants with points
 * @returns Array of participants with calculated tickets and odds
 */
export function calculateOdds<T extends WithPoints>(
  participants: T[]
): (T & { tickets: number, odds: number })[] {
  if (participants.length === 0) {
    console.log('No participants provided for odds calculation');
    return [];
  }

  // Calculate tickets for each participant (Points / 100, rounded down)
  const participantsWithTickets = participants.map(p => {
    const { points, defined } = readPoints(p);
    if (!defined) {
      console.warn(`⚠️ Participant has undefined Points/points, using 0 instead:`, p);
    }
    return {
      ...p,
      tickets: calculateTickets(points)
    };
  });

  const totalTickets = calculateTotalTickets(participantsWithTickets);

  console.log(`Odds calculation: ${participantsWithTickets.length} participants, ${totalTickets} total tickets`);

  return participantsWithTickets.map(p => {
    const odds = calculateSingleOdds(p.tickets, totalTickets);
    const { points } = readPoints(p);
    console.log(`  Participant with ${points} points has ${p.tickets} tickets (${odds.toFixed(2)}% odds)`);
    return {
      ...p,
      odds
    };
  });
}

/**
 * Calculate the tickets for a participant based on their points
 * 
 * @param points The participant's points
 * @returns The number of tickets
 */
export function calculateTickets(points: number): number {
  return Math.floor(points / 100);
}

/**
 * Calculate the odds of winning for a single participant
 * 
 * @param tickets The participant's tickets
 * @param totalTickets The total tickets in the round
 * @returns The percentage odds of winning
 */
export function calculateSingleOdds(tickets: number, totalTickets: number): number {
  // Handle edge cases
  if (tickets < 0) {
    console.warn(`Invalid ticket count: ${tickets}, using 0 instead`);
    tickets = 0;
  }
  
  if (totalTickets <= 0) {
    console.warn(`Invalid total tickets: ${totalTickets}, odds will be 0`);
    return 0;
  }
  
  // If there are tickets, return proper odds
  return (tickets / totalTickets) * 100;
}

/**
 * Calculate the total tickets in a round based on all participants' points
 * 
 * @param participants Array of participants with points or tickets
 * @returns The total number of tickets in the round
 */
export function calculateTotalTickets(participants: Array<WithPoints & { tickets?: number }>): number {
  return participants.reduce((sum, p) => {
    if (p.tickets !== undefined) {
      return sum + p.tickets;
    }
    const { points, defined } = readPoints(p);
    return defined ? sum + calculateTickets(points) : sum;
  }, 0);
}

/**
 * Format odds as a percentage string with 2 decimal places
 * 
 * @param odds The odds as a number
 * @returns Formatted odds string (e.g., "0.54%")
 */
export function formatOddsAsPercentage(odds: number): string {
  return `${odds.toFixed(2)}%`;
}