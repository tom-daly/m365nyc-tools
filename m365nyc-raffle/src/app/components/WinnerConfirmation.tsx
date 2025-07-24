import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { getUserAvatarPath, getFallbackAvatar } from '@/utils/photoUtils';

interface WinnerConfirmationProps {
    winner: string;
    roundName: string;
    onConfirm: () => void;
    onReject: () => void;
    onClose?: () => void;
    isVisible?: boolean;
}

const WinnerConfirmation: React.FC<WinnerConfirmationProps> = ({
    winner,
    roundName,
    onConfirm,
    onReject,
    onClose,
    isVisible = true
}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const avatarPath = getUserAvatarPath(winner);
    const fallbackAvatar = getFallbackAvatar(winner);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setIsLoading(false);
    };
    // Handle reject with loser sound
    const handleReject = () => {
        // Play loser sound
        const audio = new Audio('/sounds/loser.mp3');
        audio.volume = 0.8; // 80% volume
        audio.play().catch(error => {
            console.log('🔇 Could not play loser sound (browser policy):', error);
        });
        
        // Close modal after 4 seconds (loser sound duration)
        setTimeout(() => {
            onReject();
        }, 4000);
    };
    // Trigger confetti and sound when component mounts
    useEffect(() => {
        // Play celebration sound
        const audio = new Audio('/sounds/winner.mp3');
        audio.volume = 0.20; // 20% reduction from 0.6 (0.6 * 0.8 = 0.48)
        audio.load(); // Force load
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🎉 Winner confirmation sound played successfully');
                })
                .catch(error => {
                    console.log('🔇 Could not play celebration sound (browser policy):', error);
                    console.log('Try interacting with the page first to enable audio');
                });
        }

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
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="fixed top-0 left-0 w-full h-full min-h-screen bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        exit={{ y: 50 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg mx-4 shadow-2xl relative z-10 pointer-events-auto"
                    >
                {/* Close X Button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

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
                            {/* Large Avatar (200x200) for Winner Display */}
                            <div className="relative w-44 h-44">
                                {avatarPath && !imageError ? (
                                    <>
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                        )}
                                        <Image
                                            src={avatarPath}
                                            alt={`${winner}'s avatar`}
                                            fill
                                            className={`rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 ${
                                                isLoading ? 'opacity-0' : 'opacity-100'
                                            } transition-opacity`}
                                            onLoad={handleImageLoad}
                                            onError={handleImageError}
                                        />
                                    </>
                                ) : (
                                    <Image
                                        src={fallbackAvatar}
                                        alt={`${winner}'s avatar`}
                                        fill
                                        className="rounded-full border-4 border-gray-200 dark:border-gray-600"
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                                    {winner}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {roundName}
                                </p>
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
                            onClick={handleReject}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transition-all whitespace-nowrap"
                        >
                            🔄 Draw Again
                        </motion.button>
                        </div>
                    </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default WinnerConfirmation;
