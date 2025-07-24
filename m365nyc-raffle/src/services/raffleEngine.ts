import { 
  RaffleModel, 
  RaffleModelType, 
  RaffleParticipant, 
  RaffleRound, 
  RaffleResult,
  RaffleConfiguration 
} from '../types/raffleModels';
import { RAFFLE_MODELS } from './raffleModels';

export class RaffleEngine {
  private participants: RaffleParticipant[] = [];
  private rounds: RaffleRound[] = [];
  private currentRound: number = 0;
  private configuration: RaffleConfiguration;

  constructor(participants: RaffleParticipant[], configuration: RaffleConfiguration) {
    this.participants = [...participants];
    this.configuration = configuration;
    this.calculateTickets();
  }

  private calculateTickets(): void {
    this.participants.forEach(participant => {
      // Universal ticket calculation: points ÷ 100
      participant.tickets = Math.max(1, Math.floor(participant.points / 100));
    });
  }

  private getActiveParticipants(): RaffleParticipant[] {
    return this.participants.filter(p => p.isActive && !p.isWinner);
  }

  private selectWinners(model: RaffleModel, count: number): RaffleParticipant[] {
    const activeParticipants = this.getActiveParticipants();
    const winners: RaffleParticipant[] = [];

    if (activeParticipants.length === 0) return winners;

    if (model.properties.weightedSystem) {
      // Weighted selection based on tickets
      winners.push(...this.selectWeightedWinners(activeParticipants, count));
    } else {
      // Uniform selection (equal chances)
      winners.push(...this.selectUniformWinners(activeParticipants, count));
    }

    return winners;
  }

  private selectWeightedWinners(participants: RaffleParticipant[], count: number): RaffleParticipant[] {
    const winners: RaffleParticipant[] = [];
    const availableParticipants = [...participants];

    for (let i = 0; i < count && availableParticipants.length > 0; i++) {
      // Create weighted pool
      const weightedPool: RaffleParticipant[] = [];
      
      availableParticipants.forEach(participant => {
        // Add participant multiple times based on ticket count
        for (let j = 0; j < participant.tickets; j++) {
          weightedPool.push(participant);
        }
      });

      if (weightedPool.length === 0) break;

      // Random selection from weighted pool
      const randomIndex = Math.floor(Math.random() * weightedPool.length);
      const winner = weightedPool[randomIndex];
      
      winners.push(winner);
      
      // Remove winner from available participants
      const winnerIndex = availableParticipants.findIndex(p => p.id === winner.id);
      if (winnerIndex > -1) {
        availableParticipants.splice(winnerIndex, 1);
      }
    }

    return winners;
  }

  private selectUniformWinners(participants: RaffleParticipant[], count: number): RaffleParticipant[] {
    const winners: RaffleParticipant[] = [];
    const availableParticipants = [...participants];

    // Even though it's "uniform", we still calculate tickets
    // The difference is that uniform doesn't use weighted probability
    for (let i = 0; i < count && availableParticipants.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      const winner = availableParticipants[randomIndex];
      
      winners.push(winner);
      availableParticipants.splice(randomIndex, 1);
    }

    return winners;
  }

  private eliminateParticipants(model: RaffleModel): RaffleParticipant[] {
    if (!model.properties.dropOffAfterRound) {
      return [];
    }

    const activeParticipants = this.getActiveParticipants();
    let eliminationCount = 0;

    if (model.properties.eliminationCalculation === 'players_per_round') {
      // totalPlayers / numberOfRounds = playersEliminatedPerRound
      const totalPlayers = this.participants.length;
      eliminationCount = Math.floor(totalPlayers / this.configuration.totalRounds);
    }

    if (eliminationCount === 0 || activeParticipants.length === 0) return [];

    // Don't eliminate more players than are available
    eliminationCount = Math.min(eliminationCount, activeParticipants.length);

    // Random elimination for uniform system
    const shuffled = [...activeParticipants].sort(() => Math.random() - 0.5);
    const eliminated = shuffled.slice(0, eliminationCount);

    eliminated.forEach(participant => {
      participant.isActive = false;
      participant.eliminatedInRound = this.currentRound;
    });

    return eliminated;
  }

  public runRound(modelType: RaffleModelType, winnerCount: number = 1): RaffleRound {
    this.currentRound++;
    const model = RAFFLE_MODELS[modelType];
    const participantsBefore = this.getActiveParticipants().length;

    // Select winners
    const winners = this.selectWinners(model, winnerCount);
    
    // Mark winners
    winners.forEach(winner => {
      if (model.properties.removeWinners) {
        winner.isWinner = true;
        winner.wonInRound = this.currentRound;
        // Keep them active if it's continuous model, remove if elimination model
        if (model.properties.dropOffAfterRound) {
          winner.isActive = false;
        }
      }
    });

    // Eliminate participants (if applicable)
    const eliminated = this.eliminateParticipants(model);

    const participantsAfter = this.getActiveParticipants().length;

    const round: RaffleRound = {
      roundNumber: this.currentRound,
      modelType,
      participantsBefore,
      participantsAfter,
      winners: winners.map(w => w.id),
      eliminated: eliminated.map(e => e.id),
      timestamp: new Date()
    };

    this.rounds.push(round);
    return round;
  }

  public getResult(): RaffleResult {
    return {
      rounds: this.rounds,
      finalWinners: this.participants.filter(p => p.isWinner),
      totalParticipants: this.participants.length,
      modelUsed: this.rounds.length > 0 ? 
        RAFFLE_MODELS[this.rounds[this.rounds.length - 1].modelType] : 
        RAFFLE_MODELS[RaffleModelType.UNIFORM_ELIMINATION]
    };
  }

  public getParticipants(): RaffleParticipant[] {
    return this.participants;
  }

  public reset(): void {
    this.participants.forEach(p => {
      p.isActive = true;
      p.isWinner = false;
      p.eliminatedInRound = undefined;
      p.wonInRound = undefined;
    });
    this.rounds = [];
    this.currentRound = 0;
    this.calculateTickets();
  }
}
