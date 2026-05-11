export interface TeamData {
  Team: string;
  Points: number;
  Submissions: number;
  'Last Submission': string;
  playerNumber?: number; // Ranking based on points (highest points = #1)
  status?: 'eligible' | 'winner' | 'removed' | 'withdrawn';
  displayName?: string; // Friendly name to show; falls back to Team when absent
  disambiguator?: string; // Free-form disambiguator (email, ID, anything) — masked in UI
  avatarSrc?: string; // Generated or uploaded avatar source used before catalog lookup
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
  pendingWinner?: string; // Single-winner mode: winner waiting for confirmation
  pendingWinners: string[]; // Multi-winner mode: winners accumulated for batch confirmation
  multiDrawTarget?: number; // Multi-winner mode: total winners to draw in current batch
  withdrawnPlayers: string[]; // Players who were withdrawn after being selected as winners
}
