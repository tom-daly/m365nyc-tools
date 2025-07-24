import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TeamData } from '@/types/raffle';
import UserPhotoOptimized from './UserPhotoOptimized';

interface VirtualizedDataTableProps {
  teams: TeamData[];
  title?: string;
  showOdds?: boolean;
  oddsPerRound?: number[][];
  currentRound?: number;
  rowHeight?: number; // Height of each row in pixels
  maxVisibleRows?: number; // Maximum rows to render at once
}

// Memoized row component for virtual scrolling
const VirtualRow = React.memo(({ 
  team, 
  index, 
  showOdds, 
  oddsPerRound, 
  currentRound,
  style 
}: { 
  team: TeamData; 
  index: number; 
  showOdds: boolean; 
  oddsPerRound: number[][]; 
  currentRound: number;
  style: React.CSSProperties;
}) => {
  // Memoize expensive calculations
  const { statusColor, statusText, oddValue } = useMemo(() => {
    let statusColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    let statusText = '✅ Eligible';
    
    if (team.status === 'winner') {
      statusColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      statusText = '🏆 Winner';
    } else if (team.status === 'withdrawn' || team.status === 'removed') {
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      statusText = team.status === 'withdrawn' ? '❌ Withdrawn' : '❌ Removed';
    }

    let oddValue = '--';
    if (showOdds && oddsPerRound.length > index) {
      const teamOdds = oddsPerRound[index];
      if (teamOdds && Array.isArray(teamOdds) && currentRound >= 0 && currentRound < teamOdds.length) {
        const value = teamOdds[currentRound];
        if (value !== undefined && value !== null) {
          oddValue = `${value.toFixed(2)}%`;
        }
      }
    }

    return { statusColor, statusText, oddValue };
  }, [team.status, showOdds, oddsPerRound, index, currentRound]);

  return (
    <div style={style} className="flex border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex-1 grid grid-cols-6 gap-4 px-4 py-2 text-sm">
        <div className="font-bold text-gray-900 dark:text-gray-100">
          #{team.playerNumber || index + 1}
        </div>
        <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
          <UserPhotoOptimized name={team.Team} size="sm" />
          <span className="truncate">{team.Team}</span>
        </div>
        <div className="text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {team.Points.toLocaleString()}
          </span>
        </div>
        <div className="text-gray-900 dark:text-gray-100">
          {team.Submissions}
        </div>
        <div className="text-gray-900 dark:text-gray-100">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <div className="text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {Math.floor(team.Points / 100)} tickets
          </span>
        </div>
        {showOdds && (
          <div className="text-gray-900 dark:text-gray-100">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {oddValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

VirtualRow.displayName = 'VirtualRow';

const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({ 
  teams, 
  title = "Player Data", 
  showOdds = false, 
  oddsPerRound = [], 
  currentRound = 0,
  rowHeight = 60,
  maxVisibleRows = 20
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = maxVisibleRows * rowHeight;

  // Sort and filter teams
  const sortedTeams = useMemo(() => {
    if (teams.length === 0) return [];
    
    return [...teams]
      .filter(team => team && team.Team)
      .sort((a, b) => {
        const playerNumberA = a.playerNumber || 999;
        const playerNumberB = b.playerNumber || 999;
        return playerNumberA - playerNumberB;
      });
  }, [teams]);

  // Calculate which items to render
  const { visibleItems, totalHeight } = useMemo(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(startIndex + maxVisibleRows, sortedTeams.length);
    const visibleItems = sortedTeams.slice(startIndex, endIndex);
    const totalHeight = sortedTeams.length * rowHeight;

    return { visibleItems, totalHeight, startIndex };
  }, [sortedTeams, scrollTop, rowHeight, maxVisibleRows]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  if (teams.length === 0) {
    return null;
  }

  // For small datasets, use regular table
  if (sortedTeams.length <= 50) {
    const currentRoundOdds = currentRound ? oddsPerRound[currentRound - 1] : [];
    return <DataTable teams={teams} title={title} showOdds={showOdds} currentRoundOdds={currentRoundOdds} currentRound={currentRound} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title} ({sortedTeams.length} players - Virtual Scrolling)
          </h3>
        </div>
        
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            <div>#</div>
            <div>Player</div>
            <div>Points</div>
            <div>Submissions</div>
            <div>Status</div>
            <div>Tickets</div>
            {showOdds && <div>Odds (Round {currentRound + 1})</div>}
          </div>
        </div>

        {/* Virtualized Content */}
        <div 
          className="overflow-auto"
          style={{ height: `${Math.min(containerHeight, totalHeight)}px` }}
          onScroll={handleScroll}
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {visibleItems.map((team, index) => {
              const actualIndex = Math.floor(scrollTop / rowHeight) + index;
              return (
                <VirtualRow
                  key={team.Team}
                  team={team}
                  index={actualIndex}
                  showOdds={showOdds}
                  oddsPerRound={oddsPerRound}
                  currentRound={currentRound}
                  style={{
                    position: 'absolute',
                    top: (Math.floor(scrollTop / rowHeight) + index) * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Import regular DataTable for fallback
import DataTable from './DataTable';

export default VirtualizedDataTable;