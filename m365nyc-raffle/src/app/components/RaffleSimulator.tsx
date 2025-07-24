import React, { useState } from 'react';
import { TeamData } from '@/types/raffle';
import { RaffleModelType, RaffleParticipant, RaffleConfiguration, RaffleResult } from '@/types/raffleModels';
import { RaffleEngine } from '@/services/raffleEngine';
import { motion } from 'framer-motion';

interface RaffleSimulatorProps {
  teams: TeamData[];
  configuration: {
    raffleModel: RaffleModelType;
    numberOfRounds: number;
    winnersPerRound: number;
  };
}

export const RaffleSimulator: React.FC<RaffleSimulatorProps> = ({
  teams,
  configuration
}) => {
  const [raffleResult, setRaffleResult] = useState<RaffleResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const convertTeamsToParticipants = (teams: TeamData[]): RaffleParticipant[] => {
    return teams.map((team, index) => ({
      id: `team-${index}`,
      name: team.Team,
      email: `${team.Team.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      points: team.Points,
      tickets: Math.max(1, Math.floor(team.Points / 100)),
      isActive: true,
      isWinner: false
    }));
  };

  const runRaffle = () => {
    if (teams.length === 0) return;

    setIsRunning(true);
    
    const participants = convertTeamsToParticipants(teams);
    const raffleConfig: RaffleConfiguration = {
      totalRounds: configuration.numberOfRounds,
      winnersPerRound: configuration.winnersPerRound,
      modelType: configuration.raffleModel,
      participants
    };

    const engine = new RaffleEngine(participants, raffleConfig);

    // Run all rounds
    for (let i = 0; i < configuration.numberOfRounds; i++) {
      engine.runRound(configuration.raffleModel, configuration.winnersPerRound);
    }

    const result = engine.getResult();
    setRaffleResult(result);
    setIsRunning(false);
  };

  const resetRaffle = () => {
    setRaffleResult(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          🎲 Raffle Simulator
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runRaffle}
            disabled={isRunning || teams.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running...' : 'Run Raffle'}
          </button>
          {raffleResult && (
            <button
              onClick={resetRaffle}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Configuration</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Model:</span>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {configuration.raffleModel === RaffleModelType.UNIFORM_ELIMINATION ? 'Uniform Elimination' : 'Weighted Continuous'}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Rounds:</span>
            <div className="font-medium text-gray-900 dark:text-gray-100">{configuration.numberOfRounds}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Winners/Round:</span>
            <div className="font-medium text-gray-900 dark:text-gray-100">{configuration.winnersPerRound}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Participants:</span>
            <div className="font-medium text-gray-900 dark:text-gray-100">{teams.length}</div>
          </div>
        </div>
      </div>

      {/* Results */}
      {raffleResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Final Winners */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-bold text-green-900 dark:text-green-100 mb-3">
              🏆 Final Winners ({raffleResult.finalWinners.length})
            </h4>
            <div className="grid gap-2">
              {raffleResult.finalWinners.map((winner: RaffleParticipant) => (
                <div key={winner.id} className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded border">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{winner.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {winner.points} points • {winner.tickets} tickets • Won in Round {winner.wonInRound}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Round Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3">📊 Round Summary</h4>
            <div className="space-y-2">
              {raffleResult.rounds.map((round) => (
                <div key={round.roundNumber} className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded border">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Round {round.roundNumber}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {round.participantsBefore} → {round.participantsAfter} participants
                    {round.winners.length > 0 && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        ({round.winners.length} winners)
                      </span>
                    )}
                    {round.eliminated.length > 0 && (
                      <span className="ml-2 text-red-600 dark:text-red-400">
                        ({round.eliminated.length} eliminated)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {teams.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No participants loaded. Please upload team data to run a raffle simulation.
        </div>
      )}
    </div>
  );
};
