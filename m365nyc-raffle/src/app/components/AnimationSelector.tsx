import React from 'react';
import { motion } from 'framer-motion';

interface AnimationSelectorProps {
  animationType: 'wheel' | 'squidgame';
  onAnimationTypeChange: (type: 'wheel' | 'squidgame') => void;
}

const AnimationSelector: React.FC<AnimationSelectorProps> = ({
  animationType,
  onAnimationTypeChange
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Winner Selection Animation
      </h3>
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnimationTypeChange('wheel')}
          className={`
            flex-1 p-4 rounded-lg border-2 transition-all
            ${animationType === 'wheel' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }
          `}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🎡</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">Prize Wheel</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Classic spinning wheel animation
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnimationTypeChange('squidgame')}
          className={`
            flex-1 p-4 rounded-lg border-2 transition-all
            ${animationType === 'squidgame' 
              ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }
          `}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🟩</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">Squid Game Grid</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Grid-based ticket selection
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default AnimationSelector;
