'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRaffleState } from '@/hooks/useRaffleState';
import { TeamData } from '@/types/raffle';
import CSVUploader from './components/CSVUploader';
import DataTable from './components/DataTable';
import RaffleProgress from './components/RaffleProgress';
import PrizeWheel from './components/PrizeWheel';
import WinnersDisplay from './components/WinnersDisplay';

export default function Home() {
  const { state, actions, computed } = useRaffleState();

  const handleStartRound = () => {
    if (computed.canStartRound) {
      actions.startDraw();
    }
  };

  const handleWinnerSelected = (winner: string) => {
    actions.conductDraw(winner);
  };

  const handleSpinComplete = () => {
    actions.stopDraw();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🎯 M365 NYC Raffle System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Progressive raffle with elimination tiers based on point thresholds
          </p>
        </motion.div>

        {/* CSV Upload Section */}
        {!state.raffleStarted && state.teams.length === 0 && (
          <CSVUploader 
            onDataLoaded={(data: TeamData[]) => actions.loadTeamData(data)}
            isDisabled={state.raffleStarted}
          />
        )}

        {/* Team Data Display */}
        {state.teams.length > 0 && !state.raffleStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <DataTable teams={state.teams} title="Loaded Team Data" />
            
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={actions.startRaffle}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                🚀 Start Raffle
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Raffle Progress */}
        {state.raffleStarted && (
          <RaffleProgress
            rounds={state.rounds}
            currentRound={state.currentRound}
            remainingTeams={state.remainingTeams.length}
            totalTeams={state.teams.length}
          />
        )}

        {/* Current Round Display */}
        {state.raffleStarted && !computed.isRaffleComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Round controls */}
            <div className="text-center">
              {!state.isDrawing && computed.eligibleTeamsForCurrentRound.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartRound}
                  disabled={!computed.canStartRound}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🎲 Draw Winner - {computed.currentRoundData?.name}
                </motion.button>
              )}
              
              {computed.eligibleTeamsForCurrentRound.length === 0 && computed.currentRoundData && (
                <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    No teams meet the {computed.currentRoundData.pointThreshold} point threshold for {computed.currentRoundData.name}.
                  </p>
                </div>
              )}
            </div>

            {/* All Teams - Always show including winners */}
            {state.teams.length > 0 && (
              <>
                {(() => {
                  console.log(`PAGE STATE DEBUG: ${state.teams.length} teams in state`);
                  console.log(`Winners: ${state.teams.filter(t => t.status === 'winner').length}`);
                  console.log(`Eligible: ${state.teams.filter(t => t.status === 'eligible').length}`);
                  console.log(`Removed: ${state.teams.filter(t => t.status === 'removed').length}`);
                  console.log(`Withdrawn: ${state.teams.filter(t => t.status === 'withdrawn').length}`);
                  console.log(`Top 3 by player number: #${state.teams.find(t => t.playerNumber === 1)?.Team}, #${state.teams.find(t => t.playerNumber === 2)?.Team}, #${state.teams.find(t => t.playerNumber === 3)?.Team}`);
                  console.log(`About to pass ${state.teams.length} teams to DataTable`);
                  return null;
                })()}
                
                <DataTable 
                  teams={state.teams} 
                  title="All Players (Including Winners)"
                />
              </>
            )}

            {/* Current round eligible teams */}
            {computed.eligibleTeamsForCurrentRound.length > 0 && (
              <DataTable 
                teams={computed.eligibleTeamsForCurrentRound} 
                title={`${computed.currentRoundData?.name} - Eligible Teams`}
              />
            )}

            {/* Prize wheel */}
            {state.isDrawing && computed.eligibleTeamsForCurrentRound.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <PrizeWheel
                  teams={computed.eligibleTeamsForCurrentRound}
                  isSpinning={state.isDrawing}
                  onWinner={handleWinnerSelected}
                  onSpinComplete={handleSpinComplete}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Raffle Complete */}
        {computed.isRaffleComplete && state.raffleStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Raffle Complete!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                All rounds have been completed. Check out the winners below!
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={actions.resetRaffle}
              className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Reset Raffle
            </motion.button>
          </motion.div>
        )}

        {/* Winners Display */}
        {state.winners.length > 0 && (
          <WinnersDisplay winners={state.winners} />
        )}

        {/* Reset button for ongoing raffle */}
        {state.raffleStarted && !computed.isRaffleComplete && (
          <div className="text-center pt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={actions.resetRaffle}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              🔄 Reset Raffle
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
