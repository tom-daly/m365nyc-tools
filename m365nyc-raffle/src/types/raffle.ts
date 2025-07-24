export interface TeamData {
  Team: string;
  Points: number;
  Submissions: number;
  'Last Submission': string;
  playerNumber?: number; // Ranking based on points (highest points = #1)
  status?: 'eligible' | 'winner' | 'removed' | 'withdrawn';
}

export interface RaffleRound {
  id: number;
  name: string;
  pointThreshold: number;
  description: string;
}

export interface Winner {
  team: string;
  round: number;
  roundName: string;
  prize?: string;
}

export interface RaffleState {
  teams: TeamData[];
  currentRound: number;
  rounds: RaffleRound[];
  winners: Winner[];
  remainingTeams: TeamData[];
  isDrawing: boolean;
  raffleStarted: boolean;
  pendingWinner?: string; // Winner waiting for confirmation
  withdrawnPlayers: string[]; // Players who were withdrawn after being selected as winners
}
