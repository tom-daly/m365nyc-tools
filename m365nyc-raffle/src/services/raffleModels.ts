import { RaffleModel, RaffleModelType } from '../types/raffleModels';

export const RAFFLE_MODELS: Record<RaffleModelType, RaffleModel> = {
  [RaffleModelType.UNIFORM_ELIMINATION]: {
    type: RaffleModelType.UNIFORM_ELIMINATION,
    name: 'Uniform Elimination Round',
    description: 'Equal chances for all participants with progressive elimination',
    properties: {
      removeWinners: true,
      weightedSystem: false,
      dropOffAfterRound: true,
      ticketCalculation: 'points_divided_100',
      eliminationCalculation: 'players_per_round'
    }
  },
  [RaffleModelType.WEIGHTED_CONTINUOUS]: {
    type: RaffleModelType.WEIGHTED_CONTINUOUS,
    name: 'Weighted Continuous Round',
    description: 'Ticket-weighted system with continuous participation',
    properties: {
      removeWinners: true,
      weightedSystem: true,
      dropOffAfterRound: false,
      ticketCalculation: 'points_divided_100',
      eliminationCalculation: 'none'
    }
  }
};

export const getRaffleModel = (type: RaffleModelType): RaffleModel => {
  return RAFFLE_MODELS[type];
};
