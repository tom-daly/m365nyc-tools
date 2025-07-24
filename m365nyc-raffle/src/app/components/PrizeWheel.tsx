import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamData } from '@/types/raffle';
import UserPhoto from './UserPhoto';

interface PrizeWheelProps {
  teams: TeamData[];
  isSpinning: boolean;
  onWinner: (winner: string) => void;
  onSpinComplete: () => void;
}

const PrizeWheel: React.FC<PrizeWheelProps> = ({ 
  teams, 
  isSpinning, 
  onWinner, 
  onSpinComplete 
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [rotation, setRotation] = useState(0);

  // Create weighted ticket pool - memoized to prevent recalculation
  const createTicketPool = useCallback((teams: TeamData[]): string[] => {
    const tickets: string[] = [];
    teams.forEach(team => {
      const ticketCount = Math.max(1, Math.floor(team.Points / 100));
      for (let i = 0; i < ticketCount; i++) {
        tickets.push(team.Team);
      }
    });
    return tickets;
  }, []);

  useEffect(() => {
    if (isSpinning && teams.length > 0) {
      const tickets = createTicketPool(teams);
      const winnerIndex = Math.floor(Math.random() * tickets.length);
      const winner = tickets[winnerIndex];
      
      // Generate random rotation (multiple full rotations + random angle)
      const baseRotation = 360 * (5 + Math.random() * 5); // 5-10 full rotations
      const finalAngle = Math.random() * 360;
      const finalRotation = baseRotation + finalAngle;
      
      setRotation(finalRotation);
      
      // Set winner after spin animation
      setTimeout(() => {
        setSelectedTeam(winner);
        onWinner(winner);
        setTimeout(() => {
          onSpinComplete();
        }, 2000); // Show winner for 2 seconds
      }, 3000); // Spin duration
    }
  }, [isSpinning, teams, onWinner, onSpinComplete, createTicketPool]);

  // Memoize wheel segments to prevent expensive recalculation on every render
  const wheelSegments = useMemo(() => {
    return teams.map((team, index) => {
      const angle = (360 / teams.length) * index;
      const nextAngle = (360 / teams.length) * (index + 1);
      const midAngle = (angle + nextAngle) / 2;
      
      return {
        team: team.Team,
        tickets: Math.max(1, Math.floor(team.Points / 100)),
        angle,
        nextAngle,
        midAngle,
        color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`
      };
    });
  }, [teams]);

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600"></div>
        </div>
        
        {/* Wheel */}
        <motion.div
          className="relative w-80 h-80 rounded-full border-4 border-gray-800 overflow-hidden shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{ 
            duration: isSpinning ? 3 : 0, 
            ease: isSpinning ? "easeOut" : "linear" 
          }}
        >
          {wheelSegments.map((segment, index) => (
            <div
              key={`wheel-segment-${index}-${segment.team}-${segment.tickets}`}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${segment.angle}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${
                  50 + 50 * Math.cos((segment.nextAngle - segment.angle) * Math.PI / 180)
                }% ${
                  50 - 50 * Math.sin((segment.nextAngle - segment.angle) * Math.PI / 180)
                }%)`
              }}
            >
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: segment.color }}
              >
                <div 
                  className="text-white font-bold text-xs text-center px-2"
                  style={{ 
                    transform: `rotate(${(segment.nextAngle - segment.angle) / 2}deg)`,
                    transformOrigin: '50% 100%'
                  }}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <UserPhoto name={segment.team} size="sm" className="ring-2 ring-white" />
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis max-w-20">
                      {segment.team.split(' ')[0]} {/* Show first name only due to space */}
                    </div>
                    <div className="text-xs opacity-80">
                      {segment.tickets} tickets
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-full border-2 border-white"></div>
        </motion.div>
      </div>

      {/* Spinning indicator */}
      <AnimatePresence>
        {isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"
            />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Drawing winner...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner announcement */}
      <AnimatePresence>
        {selectedTeam && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="text-center p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">🎉 Winner! 🎉</h3>
              <p className="text-xl font-semibold text-white">
                {selectedTeam}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrizeWheel;
