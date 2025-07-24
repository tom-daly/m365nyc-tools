import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  isActive, 
  duration = 3000, 
  particleCount = 100 
}) => {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const colors = useMemo(() => [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Yellow
    '#BB8FCE'  // Light Purple
  ], []);

  const createConfettiPiece = useCallback((id: number): ConfettiPiece => ({
    id,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
    y: -10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 4,
    velocityY: Math.random() * 3 + 2,
    rotationSpeed: (Math.random() - 0.5) * 10
  }), [colors]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive || !isMounted) {
      setConfettiPieces([]);
      return;
    }

    // Create initial confetti pieces
    const pieces = Array.from({ length: particleCount }, (_, i) => createConfettiPiece(i));
    setConfettiPieces(pieces);

    // Animation loop
    const animationInterval = setInterval(() => {
      setConfettiPieces(prevPieces => {
        return prevPieces
          .map(piece => ({
            ...piece,
            x: piece.x + piece.velocityX,
            y: piece.y + piece.velocityY,
            rotation: piece.rotation + piece.rotationSpeed,
            velocityY: piece.velocityY + 0.1 // Gravity
          }))
          .filter(piece => piece.y < (typeof window !== 'undefined' ? window.innerHeight : 1080) + 20); // Remove pieces that fall off screen
      });
    }, 16); // ~60fps

    // Clean up after duration
    const timeout = setTimeout(() => {
      setConfettiPieces([]);
    }, duration);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(timeout);
    };
  }, [isActive, duration, particleCount, createConfettiPiece, isMounted]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confettiPieces.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute rounded-sm"
            style={{
              left: piece.x,
              top: piece.y,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
      
      {/* Additional burst effects */}
      {isActive && isMounted && (
        <>
          {/* Center burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-30" />
          </motion.div>
          
          {/* Sparkle effects */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                top: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1, 0], 
                rotate: 360,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                delay: Math.random() * 1,
                ease: "easeInOut"
              }}
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
};

export default Confetti;
