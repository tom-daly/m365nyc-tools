import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TeamData } from '@/types/raffle';
import { RoundConfigurationSettings, ConfigurationManager } from '@/utils/configurationManager';
import { RaffleModelType } from '@/types/raffleModels';
import TicketDistributionChart from './TicketDistributionChart';
import { RaffleModelSelector } from './RaffleModelSelector';

// Add to the props
interface RoundConfigurationSettingsProps {
  teams: TeamData[];
  initialSettings?: RoundConfigurationSettings;
  onSettingsChange: (settings: RoundConfigurationSettings) => void;
}

const RoundConfigurationSettingsComponent: React.FC<RoundConfigurationSettingsProps> = ({
  teams,
  initialSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<RoundConfigurationSettings>(
    initialSettings || {
      numberOfRounds: 5,
      raffleModel: RaffleModelType.UNIFORM_ELIMINATION,
      winnersPerRound: 1
    }
  );

  const [numberOfRoundsInput, setNumberOfRoundsInput] = useState<number | string>(
    initialSettings?.numberOfRounds || 5
  );

  const [showChart, setShowChart] = useState(true);
  const previousSettingsRef = useRef<string>('');

  // Memoize the preview rounds calculation to prevent unnecessary recalculations
  const previewRounds = useMemo(() => {
    if (teams.length > 0) {
      return ConfigurationManager.generateOptimalRounds(teams, settings);
    }
    return [];
  }, [teams, settings]);

  useEffect(() => {
    // Only call onSettingsChange if settings actually changed
    const settingsString = JSON.stringify(settings);
    if (previousSettingsRef.current !== settingsString) {
      previousSettingsRef.current = settingsString;
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);


  const handleNumberOfRoundsChange = (value: number | string) => {
    setNumberOfRoundsInput(value);
    
    // If it's a valid number, update the settings
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!isNaN(numericValue) && numericValue > 0) {
      setSettings(prev => ({ ...prev, numberOfRounds: numericValue }));
    }
  };

  const handleNumberOfRoundsBlur = () => {
    // Ensure we have a valid number when focus is lost
    const value = typeof numberOfRoundsInput === 'string' ? parseInt(numberOfRoundsInput, 10) : numberOfRoundsInput;
    if (isNaN(value) || value < 1) {
      const defaultValue = 2;
      setNumberOfRoundsInput(defaultValue);
      setSettings(prev => ({ ...prev, numberOfRounds: defaultValue }));
    }
  };

  const handleRaffleModelChange = (model: RaffleModelType) => {
    setSettings(prev => ({ ...prev, raffleModel: model }));
  };

  const getExpectedPlayerCount = (threshold: number) => {
    return teams.filter(team => team.Points >= threshold).length;
  };

  return (
    <div className="space-y-6">
      {/* Number of Rounds */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Number of Raffle Rounds
        </label>
        <input
          type="text"
          value={numberOfRoundsInput}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty input for editing
            if (value === '') {
              handleNumberOfRoundsChange('');
              return;
            }
            // Only allow numeric input
            const numericValue = parseInt(value, 10);
            if (!isNaN(numericValue) && numericValue > 0) {
              handleNumberOfRoundsChange(numericValue);
            }
          }}
          onBlur={handleNumberOfRoundsBlur}
          placeholder="Enter number of rounds"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Recommended: 2-20 rounds (at least 2, typically 5-15 for most events)
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
          Distribution: Players are divided evenly across rounds (Total players ÷ Number of rounds = Players per round)
        </p>
      </div>


      {/* Raffle Model Selection */}
      <div className="mt-6">
        <RaffleModelSelector
          selectedModel={settings.raffleModel || RaffleModelType.UNIFORM_ELIMINATION}
          onModelChange={handleRaffleModelChange}
        />
      </div>

      {/* Winners Per Round */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Winners Per Round
        </label>
        <input
          type="number"
          min="1"
          max="1"
          value={1}
          readOnly
          className="mt-1 block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Fixed at 1 winner per round for this system
        </p>
      </div>

      {/* Ticket Distribution Chart */}
      {teams.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              📊 Ticket Distribution Visualization
            </h4>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors cursor-pointer"
            >
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </button>
          </div>
          {showChart && (
            <div key={`chart-${teams.length}-${settings.numberOfRounds}`}>
              <TicketDistributionChart teams={teams} />
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {previewRounds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              📋 Round Preview
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {teams.length} total players → {previewRounds.length} rounds
            </div>
          </div>
          <div className="space-y-3">
            {previewRounds.map((round, index) => {
              const isWeightedContinuous = settings.raffleModel === RaffleModelType.WEIGHTED_CONTINUOUS;
              const playersRemaining = isWeightedContinuous ? teams.length : 
                (teams.length > 0 ? getExpectedPlayerCount(round.pointThreshold) : 0);
              const previousPlayersRemaining = index === 0 ? teams.length : 
                (isWeightedContinuous ? teams.length : 
                  (teams.length > 0 ? getExpectedPlayerCount(previewRounds[index - 1].pointThreshold) : 0));
              const playersDropped = isWeightedContinuous ? 0 : previousPlayersRemaining - playersRemaining;
              
              return (
                <div key={round.id} className="flex justify-between items-center py-3 px-4 bg-white dark:bg-gray-700 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{round.name}</span>
                      {!isWeightedContinuous && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          {round.pointThreshold}+ points
                        </span>
                      )}
                      {isWeightedContinuous && (
                        <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                          Weighted by tickets
                        </span>
                      )}
                    </div>
                    {index > 0 && !isWeightedContinuous && playersDropped > 0 && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium">
                        ↓ {playersDropped} players dropped from previous round
                      </div>
                    )}
                    {index > 0 && isWeightedContinuous && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
                        🎲 Previous winners remain eligible with continued weighted chances
                      </div>
                    )}
                    {index === 0 && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                        🎯 Starting round - all eligible players
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {playersRemaining}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {isWeightedContinuous ? 'active players' : 'players'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RoundConfigurationSettingsComponent;
