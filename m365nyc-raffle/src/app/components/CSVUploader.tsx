import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { TeamData } from '@/types/raffle';
import { RoundConfigurationSettings } from '@/utils/configurationManager';
import { RaffleModelType } from '@/types/raffleModels';

interface CSVUploaderProps {
  onDataLoaded: (data: TeamData[], configName?: string, roundSettings?: RoundConfigurationSettings) => void;
  isDisabled?: boolean;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataLoaded, isDisabled = false }) => {
  const [configName, setConfigName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [numberOfRounds, setNumberOfRounds] = useState<number | string>(5);
  const [uploadedData, setUploadedData] = useState<TeamData[] | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Generate default name from file
    const defaultName = file.name.replace('.csv', '') + ' - ' + new Date().toLocaleDateString();
    setConfigName(defaultName);
    setShowNameInput(true);

    Papa.parse<TeamData>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Convert Points and Submissions to numbers
        if (field === 'Points' || field === 'Submissions') {
          return parseInt(value, 10) || 0;
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          alert('Error parsing CSV file. Please check the format.');
          return;
        }

        // Validate the data structure
        const validData = results.data.filter((row): row is TeamData => {
          // Skip completely empty rows
          if (!row || Object.keys(row).length === 0 || !row.Team) {
            return false;
          }
          
          const isValid = (
            typeof row.Team === 'string' &&
            row.Team.trim() !== '' &&
            typeof row.Points === 'number' &&
            !isNaN(row.Points) &&
            typeof row.Submissions === 'number' &&
            !isNaN(row.Submissions) &&
            typeof row['Last Submission'] === 'string' &&
            row['Last Submission'].trim() !== ''
          );
          
          return isValid;
        });

        console.log(`CSV Upload: ${validData.length} valid teams loaded`);

        if (validData.length === 0) {
          alert('No valid data found. Please ensure your CSV has columns: Team, Points, Submissions, Last Submission');
          return;
        }

        // Store the uploaded data for later configuration
        setUploadedData(validData);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error reading CSV file.');
      }
    });

    // Reset the input
    event.target.value = '';
  }, []);

  const handleConfigNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigName(e.target.value);
  }, []);

  const handleRoundsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for editing
    if (value === '') {
      setNumberOfRounds('');
      return;
    }
    // Only allow numeric input
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setNumberOfRounds(numericValue);
    }
  }, []);

  const handleRoundsBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure we have a valid number when focus is lost
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setNumberOfRounds(2); // Default to minimum
    }
  }, []);

  const handleSaveConfiguration = useCallback(() => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }
    
    if (!uploadedData) {
      alert('No data uploaded');
      return;
    }

    // Ensure numberOfRounds is a valid number
    const rounds = typeof numberOfRounds === 'string' ? parseInt(numberOfRounds, 10) : numberOfRounds;
    if (isNaN(rounds) || rounds < 1) {
      alert('Please enter a valid number of rounds (at least 1)');
      return;
    }

    // Create round settings with correct defaults
    const roundSettings: RoundConfigurationSettings = {
      numberOfRounds: rounds,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      animationType: 'squidgame'
    };

    // Call the parent handler with the data and settings
    onDataLoaded(uploadedData, configName, roundSettings);
    
    setShowNameInput(false);
    setUploadedData(null);
  }, [configName, uploadedData, numberOfRounds, onDataLoaded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Configuration Name Input */}
      {showNameInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Configuration Name:
              </label>
              <input
                type="text"
                value={configName}
                onChange={handleConfigNameChange}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter configuration name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Number of Rounds:
              </label>
              <input
                type="text"
                value={numberOfRounds}
                onChange={handleRoundsChange}
                onBlur={handleRoundsBlur}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter number of rounds"
              />
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Recommended: 2-20 rounds (at least 2, typically 5-15 for most events)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Distribution: Players divided evenly across rounds (Total players ÷ Number of rounds)
              </p>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveConfiguration}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Configuration
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <label htmlFor="csv-upload" className="cursor-pointer">
          <span className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Upload CSV File
          </span>
          <span className="block text-sm text-gray-500 dark:text-gray-400 mb-4">
            Expected format: Team, Points, Submissions, Last Submission
          </span>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isDisabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            } transition-colors`}
          >
            Choose File
          </motion.div>
        </label>
        
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isDisabled}
          className="hidden"
        />
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium mb-1">CSV Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Header row with: Team, Points, Submissions, Last Submission</li>
          <li>Points and Submissions must be numeric values</li>
          <li>Player names should be unique</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default CSVUploader;
