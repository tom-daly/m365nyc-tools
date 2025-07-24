import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import UserPhoto from './UserPhoto';
import { TeamData } from '@/types/raffle';

interface WinnerConfirmationProps {
    winner: string;
    winnerData?: TeamData;
    roundName: string;
    onConfirm: () => void;
    onReject: () => void;
}

const WinnerConfirmation: React.FC<WinnerConfirmationProps> = ({
    winner,
    winnerData,
    roundName,
    onConfirm,
    onReject
}) => {
    // Trigger confetti and sound when component mounts
    useEffect(() => {
        // Play celebration sound
        const audio = new Audio('/sounds/winner.mp3');
        audio.play().catch(error => {
            console.log('Could not play celebration sound:', error);
        });

        // Multiple confetti bursts for better effect
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 55 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            // Confetti from left
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });

            // Confetti from right
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-0 left-0 w-full h-full min-h-screen bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg mx-4 shadow-2xl relative z-10"
            >
                <div className="text-center space-y-6">
                    {/* Celebration Animation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                        className="text-6xl"
                    >
                        🎉
                    </motion.div>

                    {/* Winner Info */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Winner Selected!
                        </h2>

                        <div className="flex flex-col items-center space-y-3">
                            <UserPhoto name={winner} size="4xl" />
                            <div>
                                <h3 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                                    {winner}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {roundName}
                                </p>
                                {winnerData && (
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                            {winnerData.Points}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                            {winnerData.Submissions}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all whitespace-nowrap"
                        >
                            ✅ Next Raffle
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onReject}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transition-all whitespace-nowrap"
                        >
                            🔄 Draw Again
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default WinnerConfirmation;
