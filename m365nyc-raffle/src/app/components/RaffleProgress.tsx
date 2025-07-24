import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RaffleRound } from '@/types/raffle';
import { RaffleModelType } from '@/types/raffleModels';
import { RAFFLE_MODELS } from '@/services/raffleModels';

interface RaffleProgressProps {
  rounds: RaffleRound[];
  currentRound: number;
  remainingTeams: number;
  totalTeams: number;
  raffleModel?: RaffleModelType;
}

const RaffleProgress: React.FC<RaffleProgressProps> = ({ 
  rounds, 
  currentRound, 
  remainingTeams,
  totalTeams,
  raffleModel = RaffleModelType.UNIFORM_ELIMINATION
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isWeightedContinuous = raffleModel === RaffleModelType.WEIGHTED_CONTINUOUS;
  const model = RAFFLE_MODELS[raffleModel];

  useEffect(() => {
    setIsMounted(true);
    // Set a timeout to mark that the initial load is complete
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isInitialLoad ? 0 : 0.5,
        ease: "easeOut"
      }}
      className="w-full max-w-4xl mx-auto mb-8"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Raffle Progress
          </h2>
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              {isWeightedContinuous 
                ? `${totalTeams} players eligible (all rounds)` 
                : `${remainingTeams} players remaining`
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Model: {model.name}
            </p>
          </div>
        </div>
        
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 dark:bg-gray-600 rounded-full">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={false}
              animate={{ 
                width: currentRound === 0 ? '0%' : `${(currentRound / rounds.length) * 100}%` 
              }}
              transition={{ 
                duration: isInitialLoad ? 0 : 0.5,
                ease: "easeOut"
              }}
            />
          </div>
          
          {/* Round indicators */}
          <div className="relative flex justify-between">
            {rounds.map((round, index) => {
              const isCompleted = index < currentRound;
              const isCurrent = index === currentRound;
              
              return (
                <motion.div
                  key={round.id}
                  className="flex flex-col items-center"
                  initial={false}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: isInitialLoad ? 0 : index * 0.1,
                    duration: isInitialLoad ? 0 : 0.3
                  }}
                >
                  <motion.div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }
                    `}
                    whileHover={{ scale: 1.1 }}
                  >
                    {isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      round.id
                    )}
                  </motion.div>
                  
                  <div className="mt-3 text-center max-w-24">
                    <p className={`
                      text-xs font-medium
                      ${isCurrent 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {round.name}
                    </p>
                    {!isWeightedContinuous && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {round.pointThreshold > 0 ? `${round.pointThreshold}+ pts` : 'All players'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Current round info */}
        <motion.div
          key={currentRound}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isInitialLoad ? 0 : 0.3,
            ease: "easeOut"
          }}
          className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
            {currentRound < rounds.length ? rounds[currentRound].name : 'Raffle Complete'}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-200">
            {currentRound < rounds.length 
              ? (isWeightedContinuous && rounds[currentRound].pointThreshold === 0
                  ? 'All players remain eligible (weighted by tickets)'
                  : rounds[currentRound].description
                )
              : 'All rounds completed! Check the winners below.'
            }
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RaffleProgress;
