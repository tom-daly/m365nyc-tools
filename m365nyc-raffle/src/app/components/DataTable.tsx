import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TeamData } from '@/types/raffle';
import UserPhotoOptimized from './UserPhotoOptimized';

interface DataTableProps {
  teams: TeamData[];
  title?: string;
  showOdds?: boolean;
  currentRoundOdds?: number[]; // [teamIndex] = current round odds only
  currentRound?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  storageKey?: string;
}

// Memoized row component to prevent unnecessary re-renders
const TeamRow = React.memo(({ 
  team, 
  index, 
  showOdds, 
  currentRoundOdds 
}: { 
  team: TeamData; 
  index: number; 
  showOdds: boolean; 
  currentRoundOdds: number[]; 
}) => {
  // Memoize expensive calculations
  const { statusColor, statusText, statusTooltip, oddValue } = useMemo(() => {
    const tickets = Math.floor(team.Points / 100);
    const finalStatus = team.status;
    
    // Enhanced status styling with better colors and tooltips
    let statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800';
    let statusText = '✅ Eligible';
    let statusTooltip = 'Player is eligible to participate in the raffle';
    
    if (finalStatus === 'winner') {
      statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800';
      statusText = '🏆 Winner';
      statusTooltip = 'Player has won a prize in this raffle';
    } else if (finalStatus === 'withdrawn') {
      statusColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
      statusText = tickets === 0 ? '⚠️ Auto-Withdrawn' : '❌ Withdrawn';
      statusTooltip = tickets === 0 ? 'Automatically withdrawn due to 0 raffle tickets (0 points)' : 'Player has been withdrawn from the raffle';
    } else if (finalStatus === 'removed') {
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-800';
      statusText = '❌ Removed';
      statusTooltip = 'Player has been manually removed from the raffle';
    }

    // Odds calculation - simplified for current round only
    let oddValue = '--';
    if (showOdds && currentRoundOdds && currentRoundOdds.length > index) {
      const odds = currentRoundOdds[index];
      if (odds !== undefined && odds !== null && odds > 0) {
        oddValue = `${odds.toFixed(2)}%`;
      }
    }

    return { statusColor, statusText, statusTooltip, oddValue };
  }, [team.status, showOdds, currentRoundOdds, index]);

  // Use stable key based on team name only
  return (
    <tr
      key={team.Team}
      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
        #{team.playerNumber || index + 1}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
        <div className="flex items-center space-x-3">
          <UserPhotoOptimized name={team.Team} size="sm" />
          <span>{team.Team}</span>
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {team.Points.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {team.Submissions}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <span 
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor} transition-all duration-200 hover:shadow-sm cursor-help`}
          title={statusTooltip}
        >
          {statusText}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <span 
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
            Math.floor(team.Points / 100) === 0 
              ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
          }`}
          title={`${team.Points} points ÷ 100 = ${Math.floor(team.Points / 100)} tickets`}
        >
          {Math.floor(team.Points / 100) === 1 ? '1 ticket' : `${Math.floor(team.Points / 100)} tickets`}
        </span>
      </td>
      {showOdds && (
        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
          <span 
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              oddValue === '--' 
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800 hover:shadow-sm'
            }`}
            title={oddValue === '--' ? 'No odds available for this player' : `Chance of winning in current round`}
          >
            {oddValue}
          </span>
        </td>
      )}
    </tr>
  );
});

TeamRow.displayName = 'TeamRow';

const DataTable: React.FC<DataTableProps> = ({ teams, title = "Player Data", showOdds = false, currentRoundOdds = [], currentRound = 0, collapsible = false, defaultExpanded = true, storageKey = 'dataTable' }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (!collapsible || typeof window === 'undefined') return defaultExpanded;
    const saved = localStorage.getItem(`${storageKey}-expanded`);
    return saved !== null ? JSON.parse(saved) : defaultExpanded;
  });

  const [showOddsLocal, setShowOddsLocal] = useState(() => {
    if (typeof window === 'undefined') return showOdds;
    const saved = localStorage.getItem(`${storageKey}-showOdds`);
    return saved !== null ? JSON.parse(saved) : showOdds;
  });
  
  // Save state to localStorage when it changes
  useEffect(() => {
    if (collapsible && typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-expanded`, JSON.stringify(isExpanded));
    }
  }, [isExpanded, storageKey, collapsible]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-showOdds`, JSON.stringify(showOddsLocal));
    }
  }, [showOddsLocal, storageKey]);
  // Move all useMemo calls before any early returns or conditional logic
  
  // Memoized debug calculations to prevent expensive operations on every render
  const debugStats = useMemo(() => {
    if (teams.length === 0) return { statuses: {}, winners: [] };
    
    const statuses = teams.reduce((acc, team) => {
      acc[team.status || 'undefined'] = (acc[team.status || 'undefined'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const winners = teams.filter(t => t.status === 'winner');
    
    // Reduce console output for performance
    if (process.env.NODE_ENV === 'development') {
      console.log(`DataTable "${title}" - Teams: ${teams.length}, Winners: ${winners.length}`);
    }
    
    return { statuses, winners };
  }, [teams, title]);

  // Memoized validation checks to prevent expensive operations on every render
  const validationResults = useMemo(() => {
    if (teams.length === 0) return { invalidTeams: [], hasDuplicates: false };
    
    const invalidTeams = teams.filter(team => !team || !team.Team || team.Points === undefined || team.Points === null);
    const teamNames = teams.map(t => t.Team);
    const uniqueNames = new Set(teamNames);
    const hasDuplicates = teamNames.length !== uniqueNames.size;
    
    if (invalidTeams.length > 0 && process.env.NODE_ENV === 'development') {
      console.error('INVALID TEAMS FOUND:', invalidTeams);
    }
    
    if (hasDuplicates && process.env.NODE_ENV === 'development') {
      console.error('DUPLICATE TEAMS FOUND!');
      const duplicates = teamNames.filter((name, index) => teamNames.indexOf(name) !== index);
      console.log('Duplicate team names:', duplicates);
    }
    
    return { invalidTeams, hasDuplicates };
  }, [teams]);

  // Sort teams by player number (preserves original ranking) instead of by points
  // Memoized to prevent expensive sorting on every render
  const sortedTeams = useMemo(() => {
    if (teams.length === 0) return [];
    
    return [...teams].sort((a, b) => {
      const playerNumberA = a.playerNumber || 999;
      const playerNumberB = b.playerNumber || 999;
      return playerNumberA - playerNumberB;
    });
  }, [teams]);

  // Memoized filtered teams for large datasets to reduce render load
  const visibleTeams = useMemo(() => {
    // Filter out invalid teams and implement pagination for large datasets
    const filteredTeams = sortedTeams.filter(team => team && team.Team);
    
    // For performance: if we have more than 500 teams, consider showing only first 500
    // with a "show more" option, but for now we'll render all
    return filteredTeams;
  }, [sortedTeams]);
  
  // Suppress unused variable warnings for debugging variables
  void debugStats;
  void validationResults;
  
  // Early return after all hooks
  if (teams.length === 0) {
    return null;
  }
  
  // Reduce console output for performance
  if (showOdds && currentRoundOdds.length > 0 && process.env.NODE_ENV === 'development') {
    console.log(`Odds data available for ${currentRoundOdds.length} teams for current round`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {title} ({visibleTeams.length} players)
              </h3>
              {teams.length > 0 && (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOddsLocal}
                    onChange={(e) => setShowOddsLocal(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show win odds</span>
                </label>
              )}
            </div>
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label={isExpanded ? 'Collapse table' : 'Expand table'}
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
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Raffle Tickets
                </th>
                {showOddsLocal && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Win Odds (Round {currentRound + 1})
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {visibleTeams.map((team, index) => (
                <TeamRow
                  key={team.Team}
                  team={team}
                  index={index}
                  showOdds={showOddsLocal}
                  currentRoundOdds={currentRoundOdds}
                />
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DataTable;