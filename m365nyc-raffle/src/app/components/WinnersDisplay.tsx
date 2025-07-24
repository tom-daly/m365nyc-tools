import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Winner, TeamData } from '@/types/raffle';
import UserPhoto from './UserPhoto';

interface WinnersDisplayProps {
  winners: Winner[];
  teams?: TeamData[];
  storageKey?: string;
}

const WinnersDisplay: React.FC<WinnersDisplayProps> = ({ winners, teams, storageKey = 'winnersDisplay' }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(`${storageKey}-expanded`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-expanded`, JSON.stringify(isExpanded));
    }
  }, [isExpanded, storageKey]);
  
  if (winners.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">🏆</span>
              Prize Winners ({winners.length})
            </h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-white hover:text-purple-200 rounded-lg hover:bg-purple-700/50 transition-colors"
              aria-label={isExpanded ? 'Collapse winners' : 'Expand winners'}
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {winners.map((winner, index) => {
                const winnerTeamData = teams?.find(team => team.Team === winner.team);
                
                return (
                <motion.div
                  key={`${winner.team}-${winner.round}`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    {/* Prize number */}
                    <div className="absolute top-2 right-2">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Winner content */}
                    <div className="pr-8">
                      <div className="flex items-center space-x-3 mb-3">
                        <UserPhoto name={winner.team} size="lg" />
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                            {winner.team}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {winner.roundName}
                          </p>
                          {winnerTeamData && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {Math.floor(winnerTeamData.Points / 100)} tickets
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="text-2xl mb-2"
                      >
                        🎉
                      </motion.div>
                      
                      {winner.prize && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                          {winner.prize}
                        </div>
                      )}
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full opacity-20"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-400 rounded-full opacity-20"></div>
                  </div>
                </motion.div>
                );
                })}
              </AnimatePresence>
            </div>
            
            {winners.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">🎯</div>
                <p>No winners yet. Start the raffle to begin!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WinnersDisplay;
