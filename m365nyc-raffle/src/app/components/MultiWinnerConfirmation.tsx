import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { TeamData } from '@/types/raffle';
import { getInitials, getInitialsGradient, getResolvedPhotoPath } from '@/utils/photoUtils';
import { usePhotoCatalog } from '@/utils/photoCatalog';
import TeamNameDisplay from './TeamNameDisplay';

interface MultiWinnerConfirmationProps {
    pendingWinners: string[];
    teams: TeamData[];
    roundName: string;
    isVisible?: boolean;
    onReplace: (winner: string) => void;
    onConfirmAll: () => void;
    onCancel: () => void;
}

const MultiWinnerConfirmation: React.FC<MultiWinnerConfirmationProps> = ({
    pendingWinners,
    teams,
    roundName,
    isVisible = true,
    onReplace,
    onConfirmAll,
    onCancel
}) => {
    const photoCatalog = usePhotoCatalog();

    // Celebratory burst when the panel first appears.
    useEffect(() => {
        const audio = new Audio('/sounds/winner.mp3');
        audio.volume = 0.20;
        audio.play().catch(() => {});

        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 55 };
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }
            const particleCount = 40 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed top-0 left-0 w-full h-full min-h-screen bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ y: 50, scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 50, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-2xl relative my-8"
                    >
                        <button
                            onClick={onCancel}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Cancel multi-winner draw"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center space-y-2 mb-4">
                            <div className="text-5xl">🎉</div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {pendingWinners.length} Winner{pendingWinners.length === 1 ? '' : 's'} Selected!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">{roundName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Reject any pick to silently swap in a replacement, then confirm all.
                            </p>
                        </div>

                        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                            {pendingWinners.length === 0 && (
                                <div className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                    <p className="text-yellow-800 dark:text-yellow-200">
                                        No winners remaining. No eligible replacements available.
                                    </p>
                                </div>
                            )}
                            {pendingWinners.map((teamName, idx) => {
                                const team = teams.find(t => t.Team === teamName);
                                const displayName = team?.displayName ?? teamName;
                                const avatarPath = getResolvedPhotoPath(displayName, 'avatar', photoCatalog, team?.avatarSrc);

                                return (
                                    <motion.div
                                        key={`${teamName}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 border border-yellow-200 dark:border-gray-600"
                                    >
                                        <div className="text-lg font-bold text-gray-500 dark:text-gray-400 w-6 text-center">
                                            {idx + 1}
                                        </div>
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${getInitialsGradient(displayName)} rounded-full flex items-center justify-center`}>
                                                <span className="text-white text-sm font-bold">{getInitials(displayName)}</span>
                                            </div>
                                            {avatarPath && (
                                                <Image
                                                    src={avatarPath}
                                                    alt={`${displayName}'s avatar`}
                                                    fill
                                                    className="rounded-full object-cover"
                                                    loading="eager"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                <TeamNameDisplay name={displayName} disambiguator={team?.disambiguator} />
                                            </div>
                                            {team && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {team.Points} pts · {Math.floor(team.Points / 100)} tickets
                                                </div>
                                            )}
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onReplace(teamName)}
                                            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
                                            title="Reject and pick a replacement"
                                        >
                                            🔄 Replace
                                        </motion.button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex space-x-3 mt-5">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onConfirmAll}
                                disabled={pendingWinners.length === 0}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ✅ Confirm All {pendingWinners.length > 0 ? `(${pendingWinners.length})` : ''}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MultiWinnerConfirmation;
