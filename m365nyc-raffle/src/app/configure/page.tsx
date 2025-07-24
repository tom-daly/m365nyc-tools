'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ConfigurationManager, RaffleConfiguration, RoundConfigurationSettings } from '@/utils/configurationManager';
import { TeamData } from '@/types/raffle';
import RoundConfigurationSettingsComponent from '../components/RoundConfigurationSettings';
import AnimationSelector from '../components/AnimationSelector';
import CSVUploader from '../components/CSVUploader';
import BackToTopButton from '@/components/BackToTopButton';

export default function ConfigurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');
  
  const [configuration, setConfiguration] = useState<RaffleConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationType, setAnimationType] = useState<'wheel' | 'squidgame'>('wheel');
  const [showCSVUploader, setShowCSVUploader] = useState(false);
  const configRef = useRef<RaffleConfiguration | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    configRef.current = configuration;
  }, [configuration]);

  useEffect(() => {
    if (configId) {
      const config = ConfigurationManager.getConfiguration(configId);
      if (config) {
        setConfiguration(config);
        // Initialize animation type from configuration
        setAnimationType(config.roundSettings.animationType || 'wheel');
      } else {
        setError('Configuration not found');
      }
    } else {
      setError('No configuration ID provided');
    }
    setLoading(false);
  }, [configId]);

  const handleSettingsChange = useCallback((settings: RoundConfigurationSettings) => {
    const config = configRef.current;
    if (config) {
      // Create the updated configuration with animation type
      const updatedConfig = {
        ...config,
        roundSettings: {
          ...settings,
          animationType: animationType
        },
        lastModified: new Date()
      };
      
      // Regenerate rounds with new settings
      const newRounds = ConfigurationManager.generateOptimalRounds(config.teams, settings);
      updatedConfig.rounds = newRounds;
      
      // Save to localStorage
      ConfigurationManager.saveConfiguration(updatedConfig);
      
      // Update state
      setConfiguration(updatedConfig);
    }
  }, [animationType]);

  const handleAnimationChange = useCallback((newAnimationType: 'wheel' | 'squidgame') => {
    setAnimationType(newAnimationType);
    // Also update the configuration immediately
    const config = configRef.current;
    if (config) {
      const updatedConfig = {
        ...config,
        roundSettings: {
          ...config.roundSettings,
          animationType: newAnimationType
        },
        lastModified: new Date()
      };
      
      ConfigurationManager.saveConfiguration(updatedConfig);
      setConfiguration(updatedConfig);
    }
  }, []);

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSaveAndBack = useCallback(() => {
    router.push('/configurations');
  }, [router]);

  const handleNewCSVUpload = useCallback((data: TeamData[], configName?: string, roundSettings?: RoundConfigurationSettings) => {
    const config = configRef.current;
    if (config && configName) {
      // Update configuration with new team data
      const updatedConfig = {
        ...config,
        name: configName,
        teams: data,
        roundSettings: roundSettings || config.roundSettings,
        lastModified: new Date()
      };
      
      // Regenerate rounds with new team data
      const newRounds = ConfigurationManager.generateOptimalRounds(data, updatedConfig.roundSettings);
      updatedConfig.rounds = newRounds;
      
      // Save to localStorage
      ConfigurationManager.saveConfiguration(updatedConfig);
      
      // Update state
      setConfiguration(updatedConfig);
      setShowCSVUploader(false);
    }
  }, []);

  const handleResetConfiguration = useCallback(() => {
    const shouldReset = confirm('Are you sure you want to reset this configuration? This action cannot be undone.');
    if (shouldReset && configId) {
      // Delete the configuration
      ConfigurationManager.deleteConfiguration(configId);
      // Navigate back to configurations page
      router.push('/configurations');
    }
  }, [configId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !configuration) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Configuration Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Configure Raffle
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {configuration.name} • {configuration.teams.length} players
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCSVUploader(!showCSVUploader)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Upload New CSV
              </button>
              <button
                onClick={handleResetConfiguration}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSaveAndBack}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CSV Uploader */}
        {showCSVUploader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Upload New CSV Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Upload a new CSV file to update the team data for this configuration. This will replace the existing team data.
              </p>
            </div>
            <CSVUploader
              onDataLoaded={handleNewCSVUpload}
              isDisabled={false}
            />
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Raffle Configuration Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your raffle rounds, ticket distribution, and settings for <strong>{configuration.name}</strong>
            </p>
          </div>

          <RoundConfigurationSettingsComponent
            teams={configuration.teams}
            initialSettings={configuration.roundSettings}
            onSettingsChange={handleSettingsChange}
          />

          {/* Animation Type Selector */}
          <div className="mt-6">
            <AnimationSelector
              animationType={animationType}
              onAnimationTypeChange={handleAnimationChange}
            />
          </div>
        </motion.div>
      </div>
      <BackToTopButton threshold={500} />
    </div>
  );
}
