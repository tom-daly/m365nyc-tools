export enum RaffleModelType {
  UNIFORM_ELIMINATION = 'uniform_elimination',
  WEIGHTED_CONTINUOUS = 'weighted_continuous'
}

export interface RaffleModelProperties {
  removeWinners: boolean;
  weightedSystem: boolean;
  dropOffAfterRound: boolean;
  ticketCalculation: 'points_divided_100';
  eliminationCalculation: 'players_per_round' | 'none';
}

export interface RaffleModel {
  type: RaffleModelType;
  name: string;
  description: string;
  properties: RaffleModelProperties;
}

export interface RaffleParticipant {
  id: string;
  name: string;
  email: string;
  points: number;
  tickets: number;
  isActive: boolean;
  isWinner: boolean;
  eliminatedInRound?: number;
  wonInRound?: number;
}

export interface RaffleRound {
  roundNumber: number;
  modelType: RaffleModelType;
  participantsBefore: number;
  participantsAfter: number;
  winners: string[];
  eliminated: string[];
  timestamp: Date;
}

export interface RaffleConfiguration {
  totalRounds: number;
  winnersPerRound: number;
  modelType: RaffleModelType;
  participants: RaffleParticipant[];
}

export interface RaffleResult {
  rounds: RaffleRound[];
  finalWinners: RaffleParticipant[];
  totalParticipants: number;
  modelUsed: RaffleModel;
}
