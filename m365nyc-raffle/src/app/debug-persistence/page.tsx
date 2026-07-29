'use client';

import { useState, useEffect } from 'react';
import { ConfigurationManager } from '@/utils/configurationManager';
import { RaffleModelType } from '@/types/raffleModels';
import { TeamData } from '@/types/raffle';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: unknown;
}

export default function DebugPersistencePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [csvData, setCsvData] = useState<TeamData[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const loadCSVData = async () => {
    try {
      addResult({ id: 'csv-load', name: 'Load CSV Data', status: 'pending', message: 'Loading...' });
      
      const response = await fetch('/raffleData.csv');
      const text = await response.text();
      
      // Simple CSV parsing
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',');
      const data: TeamData[] = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string | number> = {};
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'Points' || header === 'Submissions') {
            row[header] = parseInt(value, 10);
          } else {
            row[header] = value;
          }
        });
        return row as unknown as TeamData;
      });

      setCsvData(data);
      addResult({ 
        id: 'csv-load', 
        name: 'Load CSV Data', 
        status: 'success', 
        message: `Loaded ${data.length} teams`,
        details: { sampleTeam: data[0] }
      });
    } catch (error) {
      addResult({ 
        id: 'csv-load', 
        name: 'Load CSV Data', 
        status: 'error', 
        message: `Failed: ${error}` 
      });
    }
  };

  const testConfigurationSave = () => {
    try {
      addResult({ id: 'config-save', name: 'Save Configuration', status: 'pending', message: 'Saving...' });
      
      if (csvData.length === 0) {
        throw new Error('No CSV data loaded');
      }

      const config = ConfigurationManager.createConfiguration(
        `Debug_Test_${new Date().toISOString()}`,
        csvData,
        {
          numberOfRounds: 15,
          showOdds: true,
          raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
          winnersPerRound: 1,
          animationType: 'squidgame'
        }
      );

      ConfigurationManager.saveConfiguration(config);

      addResult({ 
        id: 'config-save', 
        name: 'Save Configuration', 
        status: 'success', 
        message: `Configuration ${config.id} saved`,
        details: { configId: config.id, teamsCount: config.teams.length }
      });
    } catch (error) {
      addResult({ 
        id: 'config-save', 
        name: 'Save Configuration', 
        status: 'error', 
        message: `Failed: ${error}` 
      });
    }
  };

  const testConfigurationLoad = () => {
    try {
      addResult({ id: 'config-load', name: 'Load Configurations', status: 'pending', message: 'Loading...' });
      
      const configs = ConfigurationManager.getAllConfigurations();
      
      addResult({ 
        id: 'config-load', 
        name: 'Load Configurations', 
        status: 'success', 
        message: `Found ${configs.length} configurations`,
        details: { configs: configs.map(c => ({ id: c.id, name: c.name, teams: c.teams.length })) }
      });
    } catch (error) {
      addResult({ 
        id: 'config-load', 
        name: 'Load Configurations', 
        status: 'error', 
        message: `Failed: ${error}` 
      });
    }
  };

  const testRaffleStatePersistence = () => {
    try {
      addResult({ id: 'raffle-persist', name: 'Test Raffle State Persistence', status: 'pending', message: 'Testing...' });
      
      if (csvData.length === 0) {
        throw new Error('No CSV data loaded');
      }

      // Simulate a raffle state
      const testState = {
        teams: csvData.slice(0, 10).map((team, index) => ({
          ...team,
          playerNumber: index + 1,
          status: 'eligible'
        })),
        currentRound: 2,
        rounds: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Round ${i + 1}`,
          pointThreshold: i * 1000,
          description: `Round ${i + 1} description`
        })),
        winners: [
          { team: 'Test Winner 1', round: 1, roundName: 'Round 1', prize: 'Prize 1' }
        ],
        remainingTeams: csvData.slice(1, 10).map((team, index) => ({
          ...team,
          playerNumber: index + 2,
          status: 'eligible'
        })),
        isDrawing: false,
        raffleStarted: true,
        pendingWinner: undefined,
        withdrawnPlayers: []
      };

      // Save to localStorage
      localStorage.setItem('raffleState', JSON.stringify(testState));
      
      // Verify save
      const saved = localStorage.getItem('raffleState');
      if (!saved) {
        throw new Error('Failed to save to localStorage');
      }

      // Parse and verify
      const parsed = JSON.parse(saved);
      
      addResult({ 
        id: 'raffle-persist', 
        name: 'Test Raffle State Persistence', 
        status: 'success', 
        message: `Raffle state persisted successfully`,
        details: { 
          savedSize: saved.length,
          teams: parsed.teams.length,
          currentRound: parsed.currentRound,
          winners: parsed.winners.length
        }
      });
    } catch (error) {
      addResult({ 
        id: 'raffle-persist', 
        name: 'Test Raffle State Persistence', 
        status: 'error', 
        message: `Failed: ${error}` 
      });
    }
  };

  const inspectLocalStorage = () => {
    try {
      addResult({ id: 'inspect-storage', name: 'Inspect localStorage', status: 'pending', message: 'Inspecting...' });
      
      const storage: Record<string, { size: number; preview: string }> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          storage[key] = {
            size: value?.length || 0,
            preview: value?.substring(0, 100) || ''
          };
        }
      }

      addResult({ 
        id: 'inspect-storage', 
        name: 'Inspect localStorage', 
        status: 'success', 
        message: `Found ${Object.keys(storage).length} items in localStorage`,
        details: storage
      });
    } catch (error) {
      addResult({ 
        id: 'inspect-storage', 
        name: 'Inspect localStorage', 
        status: 'error', 
        message: `Failed: ${error}` 
      });
    }
  };

  const runAllTests = async () => {
    setResults([]);
    await loadCSVData();
    setTimeout(() => testConfigurationSave(), 1000);
    setTimeout(() => testConfigurationLoad(), 2000);
    setTimeout(() => testRaffleStatePersistence(), 3000);
    setTimeout(() => inspectLocalStorage(), 4000);
  };

  useEffect(() => {
    // Check if we're running in the browser
    if (typeof window !== 'undefined') {
      console.log('🧪 Debug Persistence Page Loaded');
      console.log('🧪 localStorage available:', !!localStorage);
      console.log('🧪 Current storage keys:', Object.keys(localStorage));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Raffle Persistence Debug Page</h1>
        
        <div className="mb-8">
          <button
            onClick={runAllTests}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            🚀 Run All Tests
          </button>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <button onClick={loadCSVData} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
              📊 Load CSV
            </button>
            <button onClick={testConfigurationSave} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
              💾 Save Config
            </button>
            <button onClick={testConfigurationLoad} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded">
              📤 Load Config
            </button>
            <button onClick={testRaffleStatePersistence} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
              🎲 Test Raffle State
            </button>
            <button onClick={inspectLocalStorage} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              🔍 Inspect Storage
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={`${result.id}-${index}`}
              className={`p-4 rounded-lg border-l-4 ${
                result.status === 'success' ? 'bg-green-900 border-green-500' :
                result.status === 'error' ? 'bg-red-900 border-red-500' :
                'bg-yellow-900 border-yellow-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : '⏳'}
                </span>
                <h3 className="font-semibold">{result.name}</h3>
              </div>
              <p className="text-sm opacity-90">{result.message}</p>
              {result.details !== undefined && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm opacity-75">Show Details</summary>
                  <pre className="mt-2 text-xs bg-black bg-opacity-30 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <p>No tests run yet. Click &ldquo;Run All Tests&rdquo; to start.</p>
          </div>
        )}

        <div className="mt-12 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Manual Testing Instructions</h2>
          <ol className="space-y-2 text-sm">
            <li>1. Open browser developer tools (F12)</li>
            <li>2. Go to Console tab to see detailed debug logs</li>
            <li>3. Go to Application/Storage tab → Local Storage to inspect data</li>
            <li>4. Run tests and watch the console for detailed logging</li>
            <li>5. Check if data persists after page refresh</li>
          </ol>
        </div>
      </div>
    </div>
  );
}