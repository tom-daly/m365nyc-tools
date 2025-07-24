'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRaffleState } from '@/hooks/useRaffleState';
import { ConfigurationManager, RaffleConfiguration, RoundConfigurationSettings } from '@/utils/configurationManager';
import { TeamData } from '@/types/raffle';
import { RaffleModelType } from '@/types/raffleModels';
import CSVUploader from './components/CSVUploader';
import DataTable from './components/DataTable';
import RaffleProgress from './components/RaffleProgress';
import PrizeWheel from './components/PrizeWheel';
import SquidGameAnimation from './components/SquidGameAnimation';
import WinnersDisplay from './components/WinnersDisplay';
import WinnerConfirmation from './components/WinnerConfirmation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions, computed } = useRaffleState();
  const [currentConfig, setCurrentConfig] = useState<RaffleConfiguration | null>(null);
  const [currentRaffleModel, setCurrentRaffleModel] = useState<RaffleModelType>(RaffleModelType.WEIGHTED_CONTINUOUS);
  const [animationType, setAnimationType] = useState<'wheel' | 'squidgame'>('squidgame');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [oddsPerRound, setOddsPerRound] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasLoadedInitialConfig = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper function to update current config and save to localStorage
  const updateCurrentConfig = useCallback((config: RaffleConfiguration | null) => {
    setCurrentConfig(config);
    // Only update localStorage if we're client-side
    if (typeof window !== 'undefined') {
      if (config) {
        localStorage.setItem('currentConfigId', config.id);
      } else {
        localStorage.removeItem('currentConfigId');
      }
    }
  }, []); // Remove isMounted dependency to prevent infinite loops

  // Handle raffle model change
  const handleRaffleModelChange = (model: RaffleModelType) => {
    // Prevent updates if raffle is running
    if (state.raffleStarted && state.currentRound > 0) {
      console.warn('Cannot change raffle model after rounds have started');
      return;
    }

    // Prevent duplicate calls with the same model
    if (currentRaffleModel === model) {
      return;
    }

    setCurrentRaffleModel(model);
    actions.updateRaffleModel(model);
    
    // Update the current configuration if it exists - do this after a short delay to avoid conflicts
    setTimeout(() => {
      if (currentConfig) {
        const updatedConfig = {
          ...currentConfig,
          roundSettings: {
            ...currentConfig.roundSettings,
            raffleModel: model
          }
        };
        updateCurrentConfig(updatedConfig);
        ConfigurationManager.saveConfiguration(updatedConfig);
      }
    }, 0);
  };

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    // Initialize audio
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/intro.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      const audio = audioRef.current;
      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('play', handlePlay);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('play', handlePlay);
      };
    }
  }, []);

  // Load saved configuration on startup
  useEffect(() => {
    if (!hasLoadedInitialConfig.current && isMounted && typeof window !== 'undefined') {
      console.log('🔧 PAGE.TSX INITIAL CONFIG LOADING');
      console.log('- Current state.raffleStarted:', state.raffleStarted);
      console.log('- Current state.teams.length:', state.teams.length);
      console.log('- Current state.winners.length:', state.winners.length);
      console.log('- Current state.currentRound:', state.currentRound);
      console.log('- Full state object:', state);
      
      // Check if there's a current configuration ID in localStorage
      const currentConfigId = localStorage.getItem('currentConfigId');
      console.log('- currentConfigId from localStorage:', currentConfigId);
      
      if (currentConfigId) {
        // Load specific configuration if ID exists
        const config = ConfigurationManager.getConfiguration(currentConfigId);
        if (config) {
          console.log('Loading current configuration:', config.name);
          updateCurrentConfig(config);
          actions.loadTeamData(config.teams, true); // Preserve raffle state when loading saved config
          
          // Load the rounds from the configuration
          if (config.rounds) {
            actions.updateRounds(config.rounds);
          }
          
          // Load the raffle model from the configuration
          if (config.roundSettings && config.roundSettings.raffleModel) {
            setCurrentRaffleModel(config.roundSettings.raffleModel);
          }
          
          // Load the animation type from the configuration
          if (config.roundSettings && config.roundSettings.animationType) {
            setAnimationType(config.roundSettings.animationType);
          }
          
        } else {
          // Configuration not found, clear the ID
          localStorage.removeItem('currentConfigId');
          updateCurrentConfig(null);
          actions.resetRaffle();
        }
      } else {
        // No current configuration - check if we have any saved raffle state at all
        const savedRaffleState = localStorage.getItem('raffleState');
        console.log('- savedRaffleState exists:', !!savedRaffleState);
        
        if (savedRaffleState) {
          console.log('✅ Found saved raffle state - preserving it (not calling resetRaffle)');
          updateCurrentConfig(null);
          // Don't reset - let the useRaffleState hook handle the restoration
        } else {
          console.log('❌ No saved raffle state found, ensuring clean state');
          updateCurrentConfig(null);
          actions.resetRaffle();
        }
      }
      hasLoadedInitialConfig.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isMounted]);

  // Handle URL parameter configuration loading
  useEffect(() => {
    const configId = searchParams.get('configId');
    
    if (configId && hasLoadedInitialConfig.current && typeof window !== 'undefined') {
      console.log('Loading configuration from URL parameter:', configId);
      const config = ConfigurationManager.getConfiguration(configId);        if (config) {
          console.log('Found configuration:', config.name);
          updateCurrentConfig(config);
          actions.loadTeamData(config.teams, true); // Preserve raffle state when loading from URL
          
          // Load the rounds from the configuration
          if (config.rounds) {
            actions.updateRounds(config.rounds);
          }
          
          // Load the raffle model from the configuration
          if (config.roundSettings && config.roundSettings.raffleModel) {
            setCurrentRaffleModel(config.roundSettings.raffleModel);
          }
          
          // Load the animation type from the configuration
          if (config.roundSettings && config.roundSettings.animationType) {
            setAnimationType(config.roundSettings.animationType);
          }
          
        
        // Clear the URL parameter after loading to prevent re-triggering
        router.replace('/');
      } else {
        console.warn('Configuration not found:', configId);
        // Clear invalid URL parameter
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, actions, router]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate odds for current round only (odds change after each winner)
  useEffect(() => {
    // Calculate odds if we have teams loaded and either:
    // 1. Raffle has started with current round data, OR
    // 2. Teams are loaded (for initial odds display before raffle starts)
    if (!state.teams.length) {
      setOddsPerRound([]);
      return;
    }
    
    // If raffle hasn't started yet, calculate odds for first round (round 0)
    if (!state.raffleStarted) {
      // Calculate initial odds for all loaded teams
      import('@/utils/oddsCalculation').then(({ calculateOdds }) => {
        const participantsWithOdds = calculateOdds(state.teams);
        // Extract just the odds percentages in the same order as state.teams
        const odds = participantsWithOdds.map(p => p.odds);
        console.log('📊 Initial odds calculation result:', odds.map((odd, i) => `${state.teams[i]?.Team}: ${odd.toFixed(2)}%`));
        setOddsPerRound(odds);
      });
      return;
    }
    
    // If raffle has started, only calculate if we have current round data
    if (!computed.currentRoundData || !computed.eligibleTeamsForCurrentRound.length) {
      setOddsPerRound([]);
      return;
    }
    
    // Import the odds calculation utility
    import('@/utils/oddsCalculation').then(({ calculateOdds }) => {
      console.log(`📊 Calculating odds for current round: ${computed.currentRoundData.name}`);
      console.log(`Eligible teams: ${computed.eligibleTeamsForCurrentRound.length}`);
      
      // Calculate odds only for current round and eligible teams
      const currentRoundOdds = calculateOdds(computed.eligibleTeamsForCurrentRound);
      
      // Create a map for faster lookup
      const oddsMap = new Map<string, number>();
      currentRoundOdds.forEach(teamOdds => {
        const teamName = (teamOdds as { Team?: string; team?: string }).Team || (teamOdds as { Team?: string; team?: string }).team;
        if (teamName) {
          oddsMap.set(teamName, teamOdds.odds);
        }
      });
      
      // Create odds array matching team order in state.teams
      const odds: number[] = state.teams.map((team) => {
        // Check if team is eligible for current round
        const isEligible = computed.eligibleTeamsForCurrentRound.some(t => t.Team === team.Team);
        if (isEligible) {
          return oddsMap.get(team.Team) || 0;
        }
        return 0; // Not eligible for current round
      });
      
      console.log('📊 Odds calculation result:', odds.map((odd, i) => `${state.teams[i]?.Team}: ${odd.toFixed(2)}%`));
      setOddsPerRound(odds);
    });
  }, [state.raffleStarted, computed.currentRoundData, computed.eligibleTeamsForCurrentRound, state.teams]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        // Fade out before pausing
        const audio = audioRef.current;
        const fadeOutDuration = 3000; // 3 second fade
        const fadeSteps = 30;
        const volumeStep = audio.volume / fadeSteps;
        const fadeInterval = fadeOutDuration / fadeSteps;
        
        const fadeOut = setInterval(() => {
          if (audio.volume > volumeStep) {
            audio.volume = Math.max(0, audio.volume - volumeStep);
          } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeOut);
            // Reset volume for next play
            audio.volume = 0.3;
          }
        }, fadeInterval);
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleStartRound = () => {
    if (computed.canStartRound) {
      // Show preparing overlay during transition to Squid Game
      setIsTransitioning(true);
      
      // Delay to show overlay, then start draw
      setTimeout(() => {
        actions.startDraw();
        
        // Keep overlay visible briefly to ensure smooth transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 800);
      }, 100);
    }
  };

  const handleWinnerSelected = (winner: string) => {
    actions.selectWinner(winner);
    setModalVisible(true); // Reset modal visibility for new winner
  };

  const handleConfirmWinner = () => {
    // Start modal exit animation
    setModalVisible(false);
    
    // After modal animation completes, show transition overlay
    setTimeout(() => {
      setIsTransitioning(true);
      
      // Delay state changes to ensure overlay is fully visible
      setTimeout(() => {
        actions.confirmWinner();
        
        // Additional delay before starting draw to prevent flash
        setTimeout(() => {
          actions.startDraw();
          
          // Keep overlay visible longer to ensure SquidGame component is fully loaded
          setTimeout(() => {
            setIsTransitioning(false);
          }, 1200); // Extended to 1200ms for complete elimination of flicker
        }, 150);
      }, 100);
    }, 300); // Match the modal animation duration
  };

  const handleRejectWinner = () => {
    actions.rejectWinner();
    // Immediately start a new draw
    actions.startDraw();
  };

  const handleSpinComplete = () => {
    actions.stopDraw();
  };

  const handleCloseSquidGame = () => {
    actions.stopDraw();
  };

  const handleCloseWinnerModal = () => {
    actions.clearPendingWinner();
  };

  const handleDataLoaded = useCallback((teams: TeamData[], configName?: string, roundSettings?: RoundConfigurationSettings) => {
    if (configName) {
      const newConfig = ConfigurationManager.createConfiguration(configName, teams, roundSettings);
      ConfigurationManager.saveConfiguration(newConfig);
      updateCurrentConfig(newConfig);
      
      // Navigate to the configuration options page
      router.push(`/configure?configId=${newConfig.id}`);
      return; // Exit early to avoid loading team data here
    }
    actions.loadTeamData(teams);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, router]);



  return (
    <>
      {/* Winner Confirmation Modal - Outside main container */}
      {state.pendingWinner && computed.currentRoundData && (
        <WinnerConfirmation
          winner={state.pendingWinner}
          roundName={computed.currentRoundData.name}
          onConfirm={handleConfirmWinner}
          onReject={handleRejectWinner}
          onClose={handleCloseWinnerModal}
          isVisible={modalVisible}
        />
      )}

      {/* Transition Overlay */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-[60]"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Preparing next round...
            </p>
          </div>
        </motion.div>
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4">
        <div className="w-full max-w-[98vw] mx-auto px-2 space-y-4">        {/* Header with Always Visible Config Icon */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative"
        >
          {!state.isDrawing && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                🎯 M365 NYC Raffle System
              </h1>
              <p className="text-base text-white dark:text-white">
                🎲 Progressive raffle with elimination tiers based on point thresholds
              </p>
            </>
          )}
          
          {/* Audio Play/Pause Button - Top Left */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className="absolute top-0 left-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-30"
            title={isPlaying ? "Pause intro music" : "Play intro music"}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </motion.button>
          
          {/* Always Visible Gear Icon - Top Right */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const path = currentConfig ? `/configurations?currentConfig=${currentConfig.id}` : '/configurations';
              router.push(path);
            }}
            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-30"
            title="Manage Configurations"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Raffle Complete - Moved to Top */}
        {computed.isRaffleComplete && state.raffleStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Raffle Complete!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                All rounds have been completed. Check out the winners below!
              </p>
              
              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={actions.resetRaffle}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:from-orange-700 hover:to-red-700 transition-all"
              >
                🔄 Start New Raffle
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Start Raffle Button - Prominently placed */}
        {state.teams.length > 0 && !state.raffleStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ready to start the raffle?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {state.teams.length} players loaded and ready to participate
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={actions.startRaffle}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all text-lg"
              >
                🚀 Start Raffle
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* CSV Upload Section */}
        {!state.raffleStarted && state.teams.length === 0 && (
          <CSVUploader 
            onDataLoaded={handleDataLoaded}
            isDisabled={state.raffleStarted}
          />
        )}

        {/* Team Data Display */}
        {state.teams.length > 0 && !state.raffleStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <DataTable 
              teams={state.teams} 
              title="Loaded Player Data" 
              showOdds={false} 
              currentRoundOdds={oddsPerRound} 
              currentRound={state.currentRound}
              storageKey="playerDataTable"
            />
          </motion.div>
        )}

        {/* Raffle Controls - Moved to top */}
        {state.raffleStarted && !computed.isRaffleComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
          >
            <div className="text-center space-y-3">
              {!state.isDrawing && computed.eligibleTeamsForCurrentRound.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartRound}
                  disabled={!computed.canStartRound}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🎲 Draw Winner - {computed.currentRoundData?.name}
                </motion.button>
              )}
              
              {computed.eligibleTeamsForCurrentRound.length === 0 && computed.currentRoundData && (
                <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    No players meet the {computed.currentRoundData.pointThreshold} point threshold for {computed.currentRoundData.name}.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* Raffle Progress */}
        {state.raffleStarted && !state.isDrawing && (
          <RaffleProgress
            rounds={state.rounds}
            currentRound={state.currentRound}
            remainingTeams={state.remainingTeams.length}
            totalTeams={state.teams.length}
            raffleModel={currentRaffleModel}
          />
        )}

        {/* Prize wheel or Squid Game Animation */}
        {state.isDrawing && computed.eligibleTeamsForCurrentRound.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            {animationType === 'wheel' ? (
              <PrizeWheel
                teams={computed.eligibleTeamsForCurrentRound}
                isSpinning={state.isDrawing}
                onWinner={handleWinnerSelected}
                onSpinComplete={handleSpinComplete}
              />
            ) : (
              <SquidGameAnimation
                teams={computed.eligibleTeamsForCurrentRound}
                allTeams={state.teams}
                isSpinning={state.isDrawing}
                previousWinners={state.winners.map(w => w.team)}
                withdrawnPlayers={state.withdrawnPlayers}
                onWinner={handleWinnerSelected}
                onSpinComplete={handleSpinComplete}
                onClose={handleCloseSquidGame}
              />
            )}
          </motion.div>
        )}


        {/* Live Data Table - Single Source of Truth During Raffle */}
        {state.raffleStarted && state.teams.length > 0 && (
          <DataTable 
            teams={state.teams} 
            title="Live Player Status"
            showOdds={false}
            currentRoundOdds={oddsPerRound}
            currentRound={state.currentRound}
            collapsible={true}
            defaultExpanded={false}
            storageKey="playerDataTable"
          />
        )}


        {/* Winners Display */}
        {state.winners.length > 0 && (
          <WinnersDisplay 
            winners={state.winners} 
            teams={state.teams} 
            storageKey="prizeWinners"
          />
        )}

        {/* Reset button for ongoing raffle */}
        {state.raffleStarted && !computed.isRaffleComplete && (
          <div className="text-center pt-4">
            {/* This section is now moved to the top controls */}
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            aria-label="Back to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
        </div>
      </div>
    </>
  );
}
