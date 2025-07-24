import { TeamData, RaffleRound } from '@/types/raffle';

// Test data generators
export const generateMockTeam = (overrides: Partial<TeamData> = {}): TeamData => ({
  Team: 'Test Team',
  Points: 1000,
  Submissions: 5,
  'Last Submission': '2024-01-01',
  status: 'active',
  ...overrides,
});

export const generateMockTeams = (count: number, pointsRange: [number, number] = [0, 2000]): TeamData[] => {
  const teams: TeamData[] = [];
  const [minPoints, maxPoints] = pointsRange;
  
  for (let i = 1; i <= count; i++) {
    const points = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
    const submissions = Math.floor(Math.random() * 10) + 1;
    
    teams.push({
      Team: `Team ${i.toString().padStart(3, '0')}`,
      Points: points,
      Submissions: submissions,
      'Last Submission': '2024-01-01',
      status: 'active',
    });
  }
  
  return teams;
};

export const generateDistributedTeams = (count: number): TeamData[] => {
  const teams: TeamData[] = [];
  
  // Bell curve distribution for more realistic data
  for (let i = 1; i <= count; i++) {
    // Generate points with bell curve distribution (mean: 1000, std: 400)
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const points = Math.max(0, Math.round(1000 + z0 * 400));
    
    // Submissions roughly correlated with points but with randomness
    const baseSubmissions = Math.floor(points / 200) + 1;
    const submissions = Math.max(1, baseSubmissions + Math.floor(Math.random() * 5) - 2);
    
    teams.push({
      Team: `Team ${i.toString().padStart(3, '0')}`,
      Points: points,
      Submissions: submissions,
      'Last Submission': '2024-01-01',
      status: 'active',
    });
  }
  
  return teams.sort((a, b) => b.Points - a.Points); // Sort by points descending
};

export const defaultRounds: RaffleRound[] = [
  {
    id: 1,
    name: "Round 1",
    pointThreshold: 0,
    description: "All players eligible - First elimination round"
  },
  {
    id: 2,
    name: "Round 2", 
    pointThreshold: 250,
    description: "Players with 250+ points advance"
  },
  {
    id: 3,
    name: "Round 3",
    pointThreshold: 500,
    description: "Players with 500+ points advance"
  },
  {
    id: 4,
    name: "Round 4",
    pointThreshold: 750,
    description: "Players with 750+ points advance"
  },
  {
    id: 5,
    name: "Final Round",
    pointThreshold: 1000,
    description: "Players with 1000+ points - Weighted ticket drawing"
  }
];

// Weighted random selection (simulates the actual raffle logic)
export const selectWeightedWinner = (teams: TeamData[]): string => {
  if (teams.length === 0) throw new Error('No teams available for selection');
  
  // Calculate total tickets for all teams
  const totalTickets = teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0);
  
  if (totalTickets === 0) {
    // If no tickets, select randomly
    return teams[Math.floor(Math.random() * teams.length)].Team;
  }
  
  // Generate random number between 1 and totalTickets
  let randomNum = Math.floor(Math.random() * totalTickets) + 1;
  
  // Find the winner based on weighted selection
  for (const team of teams) {
    const teamTickets = Math.floor(team.Points / 100);
    randomNum -= teamTickets;
    if (randomNum <= 0) {
      return team.Team;
    }
  }
  
  // Fallback (should never reach here)
  return teams[0].Team;
};

// Sleep function for async tests
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
