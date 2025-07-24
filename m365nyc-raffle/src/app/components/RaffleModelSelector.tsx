import React from 'react';
import { RaffleModelType } from '../../types/raffleModels';
import { RAFFLE_MODELS } from '../../services/raffleModels';

interface RaffleModelSelectorProps {
  selectedModel: RaffleModelType;
  onModelChange: (model: RaffleModelType) => void;
  className?: string;
}

export const RaffleModelSelector: React.FC<RaffleModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Select Raffle Model
      </h3>
      
      <div className="space-y-4">
        {Object.values(RAFFLE_MODELS).map((model) => (
          <div key={model.type} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="raffleModel"
                value={model.type}
                checked={selectedModel === model.type}
                onChange={(e) => onModelChange(e.target.value as RaffleModelType)}
                className="mt-1 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {model.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {model.description}
                </div>
                
                <div className="text-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Tickets: Points ÷ 100
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${model.properties.removeWinners ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Remove Winners: {model.properties.removeWinners ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${model.properties.weightedSystem ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Selection: {model.properties.weightedSystem ? 'Weighted by Tickets' : 'Equal Probability'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${model.properties.dropOffAfterRound ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Drop Off: {model.properties.dropOffAfterRound ? 'Yes (Players/Rounds)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
