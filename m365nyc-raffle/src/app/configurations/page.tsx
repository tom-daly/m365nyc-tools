'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ConfigurationManager, RaffleConfiguration } from '@/utils/configurationManager';
import BackToTopButton from '@/components/BackToTopButton';
import { useRaffleState } from '@/hooks/useRaffleState';

export default function ConfigurationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [configurations, setConfigurations] = useState<RaffleConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<RaffleConfiguration | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [configToSwitch, setConfigToSwitch] = useState<RaffleConfiguration | null>(null);
  const { state, actions } = useRaffleState();

  // Get the current configuration ID from localStorage or URL
  useEffect(() => {
    const savedConfigId = localStorage.getItem('currentConfigId');
    const urlConfigId = searchParams.get('currentConfig');
    setCurrentConfigId(urlConfigId || savedConfigId);
  }, [searchParams]);

  const loadConfigurations = useCallback(() => {
    try {
      console.log('Loading configurations...');
      const configs = ConfigurationManager.getAllConfigurations();
      console.log('Loaded configurations:', configs);
      setConfigurations(configs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const handleSetActive = useCallback((config: RaffleConfiguration) => {
    console.log('Setting active configuration:', config.id);
    
    // Check if there's an active raffle
    const hasActiveRaffle = state.raffleStarted || state.winners.length > 0 || state.currentRound > 0;
    
    if (hasActiveRaffle && currentConfigId !== config.id) {
      // Show confirmation modal for switching
      setConfigToSwitch(config);
      setSwitchModalOpen(true);
      return;
    }
    
    // Update localStorage to set this as the current configuration
    localStorage.setItem('currentConfigId', config.id);
    setCurrentConfigId(config.id);
  }, [state.raffleStarted, state.winners.length, state.currentRound, currentConfigId]);

  const handleNew = useCallback(() => {
    console.log('Creating new configuration...');
    // Check if there's an active raffle or configuration
    const hasActiveRaffle = state.raffleStarted || state.winners.length > 0 || state.currentRound > 0;
    const hasCurrentConfig = currentConfigId !== null;
    
    if (hasActiveRaffle || hasCurrentConfig) {
      const confirmNew = window.confirm(
        'Creating a new configuration will clear your current raffle session and all data. Are you sure you want to continue?'
      );
      if (!confirmNew) {
        return;
      }
    }
    
    // Clear current configuration
    localStorage.removeItem('currentConfigId');
    setCurrentConfigId(null);
    
    // Reset raffle state to ensure clean start
    actions.resetRaffle();
    
    // Navigate back to home to create new configuration
    router.push('/');
  }, [router, currentConfigId, state.raffleStarted, state.winners.length, state.currentRound, actions]);

  const handleDelete = useCallback((config: RaffleConfiguration) => {
    console.log('Attempting to delete configuration:', config.id);
    setConfigToDelete(config);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!configToDelete) return;
    
    try {
      ConfigurationManager.deleteConfiguration(configToDelete.id);
      console.log('Configuration deleted successfully');
      
      // Force reload configurations
      loadConfigurations();
      
      // Clear currentConfigId if we're deleting the active config
      if (currentConfigId === configToDelete.id) {
        setCurrentConfigId(null);
        localStorage.removeItem('currentConfigId');
      }
      
    } catch (error) {
      console.error('Error deleting configuration:', error);
    } finally {
      setDeleteModalOpen(false);
      setConfigToDelete(null);
    }
  }, [configToDelete, currentConfigId, loadConfigurations]);

  const cancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setConfigToDelete(null);
  }, []);

  const handleResetRaffle = useCallback(() => {
    const hasActiveRaffle = state.raffleStarted || state.winners.length > 0 || state.currentRound > 0;
    
    if (hasActiveRaffle) {
      setResetModalOpen(true);
    }
  }, [state.raffleStarted, state.winners.length, state.currentRound]);

  const confirmResetRaffle = useCallback(() => {
    console.log('Resetting current raffle');
    actions.resetRaffle();
    
    // Also clear current configuration ID if no configurations are saved
    const allConfigs = ConfigurationManager.getAllConfigurations();
    if (allConfigs.length === 0) {
      localStorage.removeItem('currentConfigId');
      setCurrentConfigId(null);
    }
    
    setResetModalOpen(false);
  }, [actions]);

  const cancelResetRaffle = useCallback(() => {
    setResetModalOpen(false);
  }, []);

  const confirmSwitchConfiguration = useCallback(() => {
    if (!configToSwitch) return;
    
    console.log('Switching to configuration:', configToSwitch.id);
    // Reset raffle first, then switch configuration
    actions.resetRaffle();
    localStorage.setItem('currentConfigId', configToSwitch.id);
    setCurrentConfigId(configToSwitch.id);
    setSwitchModalOpen(false);
    setConfigToSwitch(null);
  }, [configToSwitch, actions]);

  const cancelSwitchConfiguration = useCallback(() => {
    setSwitchModalOpen(false);
    setConfigToSwitch(null);
  }, []);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deleteModalOpen) {
          cancelDelete();
        } else if (resetModalOpen) {
          cancelResetRaffle();
        } else if (switchModalOpen) {
          cancelSwitchConfiguration();
        }
      }
    };

    if (deleteModalOpen || resetModalOpen || switchModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [deleteModalOpen, resetModalOpen, switchModalOpen, cancelDelete, cancelResetRaffle, cancelSwitchConfiguration]);

  const handleConfigureRounds = useCallback((config: RaffleConfiguration) => {
    console.log('Configuring rounds for:', config.id);
    router.push(`/configure?configId=${config.id}`);
  }, [router]);

  const handleBack = useCallback(() => {
    // Navigate back to main page without URL parameters
    router.push('/');
  }, [router]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configurations...</p>
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
                  Raffle Configurations
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your saved raffle configurations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Show reset button if there's an active raffle */}
              {(state.raffleStarted || state.winners.length > 0 || state.currentRound > 0) && (
                <button
                  onClick={handleResetRaffle}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer flex items-center space-x-2"
                  title="Reset Current Raffle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Raffle</span>
                </button>
              )}
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Active Raffle Status */}
          {(state.raffleStarted || state.winners.length > 0 || state.currentRound > 0) && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                      Active Raffle in Progress
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Round {state.currentRound + 1} • {state.winners.length} winners • {state.teams.length} total participants
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetRaffle}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Raffle</span>
                </button>
              </div>
            </div>
          )}

          {/* Configurations List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Saved Configurations
            </h2>

            {configurations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium mb-2">No configurations found</p>
                <p>Create your first configuration by uploading a CSV file.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-lg border transition-all cursor-pointer ${
                      currentConfigId === config.id
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={currentConfigId === config.id 
                      ? () => router.push(`/?configId=${config.id}`) 
                      : () => handleSetActive(config)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {config.name}
                          </h3>
                          {currentConfigId === config.id && (state.raffleStarted || state.winners.length > 0 || state.currentRound > 0) && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span>Active Raffle</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {config.roundSettings?.raffleModel 
                            ? (config.roundSettings.raffleModel === 'uniform_elimination' 
                                ? 'Uniform Elimination Round' 
                                : config.roundSettings.raffleModel === 'weighted_continuous'
                                ? 'Weighted Continuous Round'
                                : config.roundSettings.raffleModel === 'weighted_elimination'
                                ? 'Weighted Elimination Round'
                                : 'Custom Model')
                            : 'Simple Division'} • {config.teams.length} players • {config.rounds.length} rounds
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                          <div>Created: {formatDate(config.createdAt)}</div>
                          <div>Modified: {formatDate(config.lastModified)}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfigureRounds(config);
                          }}
                          className="p-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Configure Rounds"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        {currentConfigId !== config.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetActive(config);
                            }}
                            className="p-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-800 cursor-pointer"
                            title="Set as Active Configuration"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        ) : (
                          <div className="p-3 rounded-lg bg-green-500 dark:bg-green-600 border border-green-600 dark:border-green-700" title="Active Configuration">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(config);
                          }}
                          className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete Configuration"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Delete Configuration
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">&ldquo;{configToDelete?.name}&rdquo;</span>? 
              This will permanently remove the configuration and all its settings.
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Configuration
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Reset Raffle Confirmation Modal */}
      {resetModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelResetRaffle}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Reset Current Raffle
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will clear all raffle progress.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to reset the current raffle? This will clear all winners, 
              round progress, and return all participants to eligible status. 
              <span className="font-semibold">This action cannot be undone.</span>
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelResetRaffle}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetRaffle}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Reset Raffle
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Switch Configuration Confirmation Modal */}
      {switchModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelSwitchConfiguration}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Switch Configuration
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will clear your current raffle progress.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              You have an active raffle in progress. Switching to 
              <span className="font-semibold">&ldquo;{configToSwitch?.name}&rdquo;</span> will 
              clear all current raffle progress including winners and round status.
              <br /><br />
              <span className="font-semibold">This action cannot be undone.</span>
            </p>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelSwitchConfiguration}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitchConfiguration}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Switch Configuration
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Back to Top Button */}
      <BackToTopButton threshold={300} />
    </div>
  );
}
