import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { TeamData } from '@/types/raffle';
import { RoundConfigurationSettings } from '@/utils/configurationManager';
import { RaffleModelType } from '@/types/raffleModels';
import { createGeneratedAvatarDataUrl } from '@/utils/photoUtils';

interface CSVUploaderProps {
  onDataLoaded: (data: TeamData[], configName?: string, roundSettings?: RoundConfigurationSettings) => void;
  isDisabled?: boolean;
}

type UploadMode = 'standard' | 'simple';

const SIMPLE_POINTS_PER_ENTRY = 100;

const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataLoaded, isDisabled = false }) => {
  const [mode, setMode] = useState<UploadMode>('standard');
  const [configName, setConfigName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [numberOfRounds, setNumberOfRounds] = useState<number | string>(5);
  const [uploadedData, setUploadedData] = useState<TeamData[] | null>(null);

  // Simple-mode column picker state
  const [simpleHeaders, setSimpleHeaders] = useState<string[]>([]);
  const [simpleRows, setSimpleRows] = useState<Record<string, string>[]>([]);
  const [nameColumn, setNameColumn] = useState<string>('');
  const [disambiguatorColumn, setDisambiguatorColumn] = useState<string>('');
  const [simpleSummary, setSimpleSummary] = useState<{ total: number; unique: number; duplicates: number } | null>(null);

  const resetState = useCallback(() => {
    setShowNameInput(false);
    setUploadedData(null);
    setSimpleHeaders([]);
    setSimpleRows([]);
    setNameColumn('');
    setDisambiguatorColumn('');
    setSimpleSummary(null);
  }, []);

  const handleStandardUpload = useCallback((file: File) => {
    Papa.parse<TeamData>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
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

        const validData = results.data.filter((row): row is TeamData => {
          if (!row || Object.keys(row).length === 0 || !row.Team) {
            return false;
          }
          return (
            typeof row.Team === 'string' &&
            row.Team.trim() !== '' &&
            typeof row.Points === 'number' &&
            !isNaN(row.Points) &&
            typeof row.Submissions === 'number' &&
            !isNaN(row.Submissions) &&
            typeof row['Last Submission'] === 'string' &&
            row['Last Submission'].trim() !== ''
          );
        });

        console.log(`CSV Upload (standard): ${validData.length} valid teams loaded`);

        if (validData.length === 0) {
          alert('No valid data found. Please ensure your CSV has columns: Team, Points, Submissions, Last Submission');
          return;
        }

        setUploadedData(validData);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error reading CSV file.');
      },
    });
  }, []);

  const handleSimpleUpload = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          alert('Error parsing CSV file. Please check the format.');
          return;
        }

        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          alert('No header row detected. The first row of your CSV must contain column names.');
          return;
        }

        const rows = (results.data ?? []).filter((row) => row && Object.keys(row).length > 0);

        setSimpleHeaders(headers);
        setSimpleRows(rows);

        // Heuristic defaults — pick a likely Name column and a likely disambiguator
        // (email/id/phone if present), otherwise leave the disambiguator blank.
        const lower = headers.map((h) => h.toLowerCase());
        const nameIdx = lower.findIndex((h) => h.includes('name'));
        const nameGuess = nameIdx >= 0 ? headers[nameIdx] : headers[0];
        const disambiguatorIdx = lower.findIndex(
          (h, i) => i !== nameIdx && (h.includes('email') || h.includes('mail') || h === 'id' || h.includes('phone'))
        );
        setNameColumn(nameGuess);
        setDisambiguatorColumn(disambiguatorIdx >= 0 ? headers[disambiguatorIdx] : '');
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error reading CSV file.');
      },
    });
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const defaultName = file.name.replace(/\.csv$/i, '') + ' - ' + new Date().toLocaleDateString();
      setConfigName(defaultName);
      setShowNameInput(true);

      if (mode === 'standard') {
        handleStandardUpload(file);
      } else {
        handleSimpleUpload(file);
      }

      event.target.value = '';
    },
    [mode, handleStandardUpload, handleSimpleUpload]
  );

  // Build deduped TeamData from simple-mode column picks
  const simpleProcessed = useMemo(() => {
    if (mode !== 'simple' || !nameColumn || simpleRows.length === 0) {
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const seen = new Map<string, TeamData>();
    const nameCounts = new Map<string, number>();
    const usedKeys = new Set<string>();
    let droppedBlank = 0;

    for (const row of simpleRows) {
      const rawName = (row[nameColumn] ?? '').toString().trim();
      if (!rawName) {
        droppedBlank++;
        continue;
      }
      const rawDisambiguator = disambiguatorColumn ? (row[disambiguatorColumn] ?? '').toString().trim() : '';
      const disambiguatorKey = rawDisambiguator.toLowerCase();
      // Dedup key: name + disambiguator (case-insensitive). When no disambiguator
      // is picked, dedup by name alone.
      const dedupKey = disambiguatorKey ? `${rawName.toLowerCase()}|${disambiguatorKey}` : rawName.toLowerCase();
      if (seen.has(dedupKey)) continue;

      // Generate a unique label among this import. First occurrence keeps the raw name;
      // subsequent duplicates get " (N)" appended. The counter skips any candidate already
      // taken — including ones produced by source values that literally contain "(N)".
      const lowerName = rawName.toLowerCase();
      let count = (nameCounts.get(lowerName) ?? 0) + 1;
      let candidate = count === 1 ? rawName : `${rawName} (${count})`;
      while (usedKeys.has(candidate)) {
        count++;
        candidate = `${rawName} (${count})`;
      }
      nameCounts.set(lowerName, count);
      usedKeys.add(candidate);

      seen.set(dedupKey, {
        Team: candidate,
        Points: SIMPLE_POINTS_PER_ENTRY,
        Submissions: 1,
        'Last Submission': today,
        // displayName mirrors the unique label so duplicates are visibly distinguishable
        // in the UI (no silent collisions where two rows render with the same name).
        displayName: candidate,
        disambiguator: rawDisambiguator || undefined,
        avatarSrc: createGeneratedAvatarDataUrl(rawName),
      });
    }

    const teams = Array.from(seen.values());
    return {
      teams,
      summary: {
        total: simpleRows.length - droppedBlank,
        unique: teams.length,
        duplicates: simpleRows.length - droppedBlank - teams.length,
      },
    };
  }, [mode, nameColumn, disambiguatorColumn, simpleRows]);

  // Keep summary state in sync for display
  React.useEffect(() => {
    if (simpleProcessed) {
      setSimpleSummary(simpleProcessed.summary);
    } else {
      setSimpleSummary(null);
    }
  }, [simpleProcessed]);

  const handleConfigNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigName(e.target.value);
  }, []);

  const handleRoundsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setNumberOfRounds('');
      return;
    }
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setNumberOfRounds(numericValue);
    }
  }, []);

  const handleRoundsBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setNumberOfRounds(2);
    }
  }, []);

  const handleSaveConfiguration = useCallback(() => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    let dataToLoad: TeamData[] | null = null;
    if (mode === 'standard') {
      dataToLoad = uploadedData;
    } else if (simpleProcessed) {
      dataToLoad = simpleProcessed.teams;
    }

    if (!dataToLoad || dataToLoad.length === 0) {
      alert('No data to load. Upload a CSV and (for Simple List mode) pick the Name column.');
      return;
    }

    const rounds = typeof numberOfRounds === 'string' ? parseInt(numberOfRounds, 10) : numberOfRounds;
    if (isNaN(rounds) || rounds < 1) {
      alert('Please enter a valid number of rounds (at least 1)');
      return;
    }

    const roundSettings: RoundConfigurationSettings = {
      numberOfRounds: rounds,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      animationType: 'squidgame',
    };

    onDataLoaded(dataToLoad, configName, roundSettings);
    resetState();
  }, [configName, uploadedData, simpleProcessed, mode, numberOfRounds, onDataLoaded, resetState]);

  const showColumnPicker = mode === 'simple' && simpleHeaders.length > 0;
  const hasReadyData = mode === 'standard' ? !!uploadedData : !!simpleProcessed && simpleProcessed.teams.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Mode toggle */}
      <div className="mb-4 flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode('standard');
            resetState();
          }}
          className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
            mode === 'standard'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Standard format
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('simple');
            resetState();
          }}
          className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
            mode === 'simple'
              ? 'bg-purple-600 text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Simple list (pick column)
        </button>
      </div>

      {/* Simple-mode hint banner — visible immediately when you toggle to Simple list */}
      {mode === 'simple' && simpleHeaders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg border border-purple-300 dark:border-purple-600 text-sm text-purple-900 dark:text-purple-50"
        >
          <div className="font-medium mb-1">Simple list mode</div>
          <div className="text-xs text-purple-800 dark:text-purple-100">
            Upload any CSV with a header row, then pick the Name column and (optionally) any column to use as a disambiguator. Each unique entry gets {SIMPLE_POINTS_PER_ENTRY} pts (1 ticket).
          </div>
        </motion.div>
      )}

      {/* Column picker (simple mode) */}
      {showColumnPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg border border-purple-300 dark:border-purple-600 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-50 mb-1">
              Name column:
            </label>
            <select
              value={nameColumn}
              onChange={(e) => setNameColumn(e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">— Pick a column —</option>
              {simpleHeaders.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-50 mb-1">
              Disambiguator column (any unique field — masked in UI):
            </label>
            <select
              value={disambiguatorColumn}
              onChange={(e) => setDisambiguatorColumn(e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">(none — dedupe by name only)</option>
              {simpleHeaders.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-purple-800 dark:text-purple-100">
              Shown as <span className="font-mono">abc***xyz</span> by default. Click the eye icon next to a name to reveal it.
            </p>
          </div>
          {simpleSummary && (
            <div className="text-xs text-purple-800 dark:text-purple-100">
              {simpleSummary.unique} unique {simpleSummary.unique === 1 ? 'entry' : 'entries'}
              {simpleSummary.duplicates > 0 && ` (${simpleSummary.duplicates} duplicates removed)`}
              {' · '}{SIMPLE_POINTS_PER_ENTRY} pts each
            </div>
          )}
        </motion.div>
      )}

      {/* Configuration Name + Rounds */}
      {showNameInput && hasReadyData && (
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
            {mode === 'standard'
              ? 'Expected format: Team, Points, Submissions, Last Submission'
              : 'Any CSV with a header row — pick the Name column after upload'}
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
        {mode === 'standard' ? (
          <>
            <p className="font-medium mb-1">CSV Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Header row with: Team, Points, Submissions, Last Submission</li>
              <li>Points and Submissions must be numeric values</li>
              <li>Player names should be unique</li>
            </ul>
          </>
        ) : (
          <>
            <p className="font-medium mb-1">Simple List mode:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload any CSV with a header row</li>
              <li>Pick which column holds the Name; optionally pick any column as a disambiguator</li>
              <li>Duplicates are removed; each unique entry gets {SIMPLE_POINTS_PER_ENTRY} points (1 ticket)</li>
              <li>The disambiguator is masked (e.g. <span className="font-mono">abc***xyz</span>); click the eye icon to reveal it</li>
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CSVUploader;
