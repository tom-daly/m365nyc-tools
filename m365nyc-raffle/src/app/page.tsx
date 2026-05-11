'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import MultiWinnerConfirmation from './components/MultiWinnerConfirmation';
import PageLoadingFallback from './components/PageLoadingFallback';
import IntroMusicButton from './components/IntroMusicButton';

type AnimationPreset = 'regular' | 'none' | 'warp-speed' | 'fast';

const RAFFLE_ANIMATION_PRESET_KEY = 'raffleAnimationPreset';
const WINNERS_TO_DRAW_KEY = 'winnersToDraw';
const DEFAULT_ANIMATION_PRESET: AnimationPreset = 'regular';
const WINNER_MODAL_EXIT_MS = 450;
const ANIMATION_PRESETS: Array<{ id: AnimationPreset; label: string; durationSec: number }> = [
  { id: 'regular', label: 'Normal / Anticipated Reveal - 15s', durationSec: 15 },
  { id: 'fast', label: 'Keep It Moving Mode - 7s', durationSec: 7 },
  { id: 'warp-speed', label: 'Warp Speed Mode - 3s', durationSec: 3 },
  { id: 'none', label: 'Crowd’s Getting Restless Mode - 0s', durationSec: 0 }
];

const getAnimationDurationMs = (preset: AnimationPreset): number => {
  return (ANIMATION_PRESETS.find(option => option.id === preset)?.durationSec ?? 15) * 1000;
};

const parseSavedAnimationPreset = (saved: string | null): AnimationPreset => {
  if (!saved) return DEFAULT_ANIMATION_PRESET;
  if (ANIMATION_PRESETS.some(option => option.id === saved)) {
    return saved as AnimationPreset;
  }

  const parsedDuration = parseFloat(saved);
  if (!Number.isFinite(parsedDuration)) return DEFAULT_ANIMATION_PRESET;
  if (parsedDuration <= 0) return 'none';
  if (parsedDuration <= 3) return 'warp-speed';
  if (parsedDuration <= 7) return 'fast';
  return 'regular';
};

function HomeContent() {
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
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>(DEFAULT_ANIMATION_PRESET);
  const [winnersToDraw, setWinnersToDraw] = useState<number>(1);
  const [showDrawSettings, setShowDrawSettings] = useState(false);
  const hasLoadedInitialConfig = useRef(false);
  const batchWinnersRef = useRef<string[]>([]);
  const remainingRounds = state.rounds.length - state.currentRound;
  const isFinalRound = state.raffleStarted && state.currentRound === state.rounds.length - 1;
  const maxWinnersByRounds = remainingRounds <= 1 ? 1 : remainingRounds - 1;
  const maxWinnersToDraw = Math.min(
    25,
    Math.max(1, computed.eligibleTeamsForCurrentRound.length),
    Math.max(1, maxWinnersByRounds)
  );

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

  // Load persisted animation preset + winner count preferences on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAnimationPreset(parseSavedAnimationPreset(localStorage.getItem(RAFFLE_ANIMATION_PRESET_KEY)));
    const savedWinners = parseInt(localStorage.getItem(WINNERS_TO_DRAW_KEY) || '1', 10);
    if (Number.isFinite(savedWinners) && savedWinners >= 1 && savedWinners <= 25) {
      setWinnersToDraw(savedWinners);
    }
  }, []);

  // Persist whenever they change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RAFFLE_ANIMATION_PRESET_KEY, animationPreset);
  }, [animationPreset]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WINNERS_TO_DRAW_KEY, String(winnersToDraw));
  }, [winnersToDraw]);

  useEffect(() => {
    const clamped = Math.max(1, Math.min(winnersToDraw, maxWinnersToDraw));
    if (winnersToDraw !== clamped) {
      console.log('⬇️ Auto-downgrading winners-to-draw', {
        requested: winnersToDraw,
        clamped,
        remainingRounds,
        maxBatchRounds: maxWinnersByRounds,
        eligibleTeams: computed.eligibleTeamsForCurrentRound.length
      });
      setWinnersToDraw(clamped);
    }
  }, [
    computed.eligibleTeamsForCurrentRound.length,
    maxWinnersToDraw,
    maxWinnersByRounds,
    remainingRounds,
    state.currentRound,
    state.rounds.length,
    winnersToDraw
  ]);

  useEffect(() => {
    if (!isFinalRound) return;

    if (winnersToDraw !== 1) {
      console.log('🏁 Final round forcing winners-to-draw to 1');
      setWinnersToDraw(1);
    }

    if (animationPreset !== 'regular') {
      console.log('🏁 Final round resetting speed to anticipated reveal');
      setAnimationPreset('regular');
    }
  }, [animationPreset, isFinalRound, winnersToDraw]);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
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
    // Cancel flag prevents an in-flight import from overwriting state after the
    // effect has re-run with newer inputs (otherwise two pending promises race
    // to call setOddsPerRound and the older result can win).
    let cancelled = false;

    if (!state.teams.length) {
      setOddsPerRound([]);
      return;
    }

    if (!state.raffleStarted) {
      const teamsSnapshot = state.teams;
      import('@/utils/oddsCalculation').then(({ calculateOdds }) => {
        if (cancelled) return;
        const participantsWithOdds = calculateOdds(teamsSnapshot);
        const odds = participantsWithOdds.map(p => p.odds);
        console.log('📊 Initial odds calculation result:', odds.map((odd, i) => `${teamsSnapshot[i]?.Team}: ${odd.toFixed(2)}%`));
        setOddsPerRound(odds);
      });
      return () => {
        cancelled = true;
      };
    }

    if (!computed.currentRoundData || !computed.eligibleTeamsForCurrentRound.length) {
      setOddsPerRound([]);
      return;
    }

    // Snapshot the inputs so the async calculation uses the same values the
    // effect was scheduled with, even if `computed` re-references between now
    // and when the dynamic import resolves.
    const currentRound = computed.currentRoundData;
    const eligibleTeams = computed.eligibleTeamsForCurrentRound;
    const teamsSnapshot = state.teams;

    import('@/utils/oddsCalculation').then(({ calculateOdds }) => {
      if (cancelled) return;
      console.log(`📊 Calculating odds for current round: ${currentRound.name}`);
      console.log(`Eligible teams: ${eligibleTeams.length}`);

      const currentRoundOdds = calculateOdds(eligibleTeams);

      const oddsMap = new Map<string, number>();
      currentRoundOdds.forEach(teamOdds => {
        const teamName = (teamOdds as { Team?: string; team?: string }).Team || (teamOdds as { Team?: string; team?: string }).team;
        if (teamName) {
          oddsMap.set(teamName, teamOdds.odds);
        }
      });

      const eligibleSet = new Set(eligibleTeams.map(t => t.Team));
      const odds: number[] = teamsSnapshot.map(team =>
        eligibleSet.has(team.Team) ? (oddsMap.get(team.Team) || 0) : 0
      );

      console.log('📊 Odds calculation result:', odds.map((odd, i) => `${teamsSnapshot[i]?.Team}: ${odd.toFixed(2)}%`));
      setOddsPerRound(odds);
    });

    return () => {
      cancelled = true;
    };
  }, [state.raffleStarted, computed.currentRoundData, computed.eligibleTeamsForCurrentRound, state.teams]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleStartRound = () => {
    if (!computed.canStartRound) return;

    // Cap target at what's actually achievable: input value, eligible pool, remaining rounds.
    const target = Math.max(1, Math.min(winnersToDraw, maxWinnersToDraw));

    batchWinnersRef.current = [];
    actions.setMultiDrawTarget(target > 1 ? target : undefined);

    if (animationPreset === 'none') {
      const weightedPool = computed.eligibleTeamsForCurrentRound.flatMap(team =>
        Array.from({ length: Math.max(1, Math.floor(team.Points / 100)) }, () => team.Team)
      );
      const selectedWinners: string[] = [];
      const pool = [...weightedPool];

      while (selectedWinners.length < target && pool.length > 0) {
        const nextWinner = pool[Math.floor(Math.random() * pool.length)];
        selectedWinners.push(nextWinner);
        for (let i = pool.length - 1; i >= 0; i--) {
          if (pool[i] === nextWinner) {
            pool.splice(i, 1);
          }
        }
      }

      console.log('⚡ None animation preset selected winners immediately:', selectedWinners);

      if (selectedWinners.length === 0) return;

      if (target > 1) {
        actions.selectBatchWinners(selectedWinners);
      } else {
        actions.selectWinner(selectedWinners[0]);
        setModalVisible(true);
      }
      return;
    }

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
  };

  const handleConfirmAllMultiWinners = () => {
    actions.confirmAllPendingWinners();
  };

  const handleCancelMultiDraw = () => {
    batchWinnersRef.current = [];
    actions.cancelMultiDraw();
  };

  const handleAddRounds = useCallback((additionalRounds: number) => {
    const safeAdditionalRounds = Math.max(1, Math.min(additionalRounds, 25));
    const newTotalRounds = state.rounds.length + safeAdditionalRounds;

    const settings: RoundConfigurationSettings = {
      numberOfRounds: newTotalRounds,
      raffleModel: currentRaffleModel,
      winnersPerRound: currentConfig?.roundSettings.winnersPerRound ?? 1,
      showOdds: currentConfig?.roundSettings.showOdds ?? false,
      animationType
    };

    const regeneratedRounds = ConfigurationManager.generateOptimalRounds(state.teams, settings);
    const completedRounds = state.rounds.slice(0, Math.min(state.currentRound, state.rounds.length));
    const mergedRounds = [...completedRounds, ...regeneratedRounds.slice(completedRounds.length)].map((round, index, allRounds) => ({
      ...round,
      id: index + 1,
      name: index === allRounds.length - 1 ? 'Final Round' : `Round ${index + 1}`
    }));

    console.log('➕ Extending raffle rounds', {
      previousTotal: state.rounds.length,
      added: safeAdditionalRounds,
      newTotal: mergedRounds.length,
      currentRound: state.currentRound
    });

    actions.updateRounds(mergedRounds);

    if (currentConfig) {
      const updatedConfig: RaffleConfiguration = {
        ...currentConfig,
        roundSettings: {
          ...currentConfig.roundSettings,
          numberOfRounds: mergedRounds.length,
          raffleModel: currentRaffleModel,
          animationType
        },
        rounds: mergedRounds,
        lastModified: new Date()
      };

      ConfigurationManager.saveConfiguration(updatedConfig);
      updateCurrentConfig(updatedConfig);
    }
  }, [
    actions,
    animationType,
    currentConfig,
    currentRaffleModel,
    state.currentRound,
    state.rounds,
    state.teams,
    updateCurrentConfig
  ]);

  const handleReplacePendingWinner = (rejected: string) => {
    actions.replacePendingWinner(rejected);
  };

  const handleWinnerSelected = (winner: string) => {
    actions.selectWinner(winner);
    setModalVisible(true); // Reset modal visibility for new winner
  };

  const handleBatchWinnersSelected = (winners: string[]) => {
    if (!state.multiDrawTarget || state.multiDrawTarget <= 1) return;

    console.log('🎯 Multi-winner animation selected batch:', winners);
    batchWinnersRef.current = winners;
  };

  const handleConfirmWinner = () => {
    console.log('✅ Confirming winner and returning to manual round control');
    // Start modal exit animation
    setModalVisible(false);
    
    // After the modal exit finishes, commit the winner and wait for the user to
    // explicitly start the next draw. Auto-starting here caused the raffle to
    // appear to run twice.
    setTimeout(() => {
      actions.confirmWinner();
    }, WINNER_MODAL_EXIT_MS);
  };

  const handleRejectWinner = () => {
    console.log('🔄 Rejecting winner and easing into redraw');
    setModalVisible(false);

    setTimeout(() => {
      actions.rejectWinner();
      actions.startDraw();
    }, WINNER_MODAL_EXIT_MS);
  };

  const handleSpinComplete = () => {
    if (state.multiDrawTarget && state.multiDrawTarget > 1 && batchWinnersRef.current.length > 0) {
      console.log('🎉 Completing one-spin multi-winner batch draw');
      actions.selectBatchWinners(batchWinnersRef.current);
      batchWinnersRef.current = [];
      return;
    }

    actions.stopDraw();
  };

  const handleCloseSquidGame = () => {
    batchWinnersRef.current = [];
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
      {state.pendingWinner && computed.currentRoundData && (() => {
        const pendingTeamData = state.teams.find(t => t.Team === state.pendingWinner);
        return (
          <WinnerConfirmation
            winner={state.pendingWinner}
            winnerDisplayName={pendingTeamData?.displayName}
            winnerDisambiguator={pendingTeamData?.disambiguator}
            avatarSrc={pendingTeamData?.avatarSrc}
            roundName={computed.currentRoundData.name}
            onConfirm={handleConfirmWinner}
            onReject={handleRejectWinner}
            onClose={handleCloseWinnerModal}
            isVisible={modalVisible}
            exitDurationMs={WINNER_MODAL_EXIT_MS}
          />
        );
      })()}

      {/* Multi-Winner Batch Confirmation: shown when target reached, or when
          target not reached but the eligible pool is exhausted. */}
      {(() => {
        if (state.isDrawing) return null;
        if (!state.multiDrawTarget || state.multiDrawTarget <= 1) return null;
        if (state.pendingWinners.length === 0) return null;

        const reachedTarget = state.pendingWinners.length >= state.multiDrawTarget;
        const pendingSet = new Set(state.pendingWinners);
        const remainingEligible = computed.eligibleTeamsForCurrentRound.filter(
          t => !pendingSet.has(t.Team) && Math.floor(t.Points / 100) > 0
        );
        const poolExhausted = remainingEligible.length === 0;

        if (!reachedTarget && !poolExhausted) return null;

        return (
          <MultiWinnerConfirmation
            pendingWinners={state.pendingWinners}
            teams={state.teams}
            roundName={computed.currentRoundData?.name ?? 'Final Round'}
            onReplace={handleReplacePendingWinner}
            onConfirmAll={handleConfirmAllMultiWinners}
            onCancel={handleCancelMultiDraw}
          />
        );
      })()}

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
                🎯 Super Fun Raffle System
              </h1>
              <p className="text-base text-white dark:text-white">
                🎲 Progressive raffle with elimination tiers based on point thresholds
              </p>
            </>
          )}
          
          {/* Audio Play/Pause Button - Top Left */}
          <IntroMusicButton
            className="absolute top-0 left-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-30"
          />
          
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
            <div className="text-center">
              {!state.isDrawing && computed.eligibleTeamsForCurrentRound.length > 0 && (
                <>
                  <div className="relative flex items-center justify-center min-h-[52px]">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartRound}
                      disabled={!computed.canStartRound}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      🎲 Draw {winnersToDraw > 1 ? `${winnersToDraw} Winners` : 'Winner'} - {computed.currentRoundData?.name}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowDrawSettings(prev => !prev)}
                      className="absolute right-0 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-expanded={showDrawSettings}
                      aria-controls="draw-settings-panel"
                      aria-label={showDrawSettings ? 'Collapse draw settings' : 'Expand draw settings'}
                    >
                      <svg
                        className={`w-5 h-5 transform transition-transform ${showDrawSettings ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {showDrawSettings && (
                      <motion.div
                        id="draw-settings-panel"
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center justify-center gap-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                          <div className="flex items-center gap-3">
                            <label
                              htmlFor="raffle-animation-preset"
                              className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              Speed:
                            </label>
                            <select
                              id="raffle-animation-preset"
                              value={animationPreset}
                              onChange={(e) => setAnimationPreset(e.target.value as AnimationPreset)}
                              disabled={isFinalRound}
                              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title={isFinalRound ? 'Final round always uses Normal / Anticipated Reveal - 15s' : 'Choose the draw speed'}
                            >
                              {ANIMATION_PRESETS.map(option => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="winners-to-draw"
                              className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Winners:
                            </label>
                            <input
                              id="winners-to-draw"
                              type="number"
                              min={1}
                              max={maxWinnersToDraw}
                              value={winnersToDraw}
                              disabled={isFinalRound}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (Number.isFinite(v)) {
                                  setWinnersToDraw(Math.max(1, Math.min(v, 25)));
                                }
                              }}
                              className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {isFinalRound ? 'Final round always pulls 1 winner' : '# of winners to pull'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
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
            onAddRounds={handleAddRounds}
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
                teams={computed.eligibleTeamsForCurrentRound.filter(
                  t => !state.pendingWinners.includes(t.Team)
                )}
                isSpinning={state.isDrawing}
                targetDurationMs={getAnimationDurationMs(animationPreset)}
                onWinner={handleWinnerSelected}
                onSpinComplete={handleSpinComplete}
              />
            ) : (
              <SquidGameAnimation
                teams={computed.eligibleTeamsForCurrentRound.filter(
                  t => !state.pendingWinners.includes(t.Team)
                )}
                allTeams={state.teams}
                isSpinning={state.isDrawing}
                targetDurationMs={getAnimationDurationMs(animationPreset)}
                winnerCount={state.multiDrawTarget ?? 1}
                previousWinners={[
                  ...state.winners.map(w => w.team),
                  ...state.pendingWinners
                ]}
                withdrawnPlayers={state.withdrawnPlayers}
                onWinner={handleWinnerSelected}
                onBatchWinners={handleBatchWinnersSelected}
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
            showOdds={true}
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

export default function Home() {
  // Force the dark theme on the home page only. The Tailwind `dark:` variants
  // already styled throughout this tree light up against this wrapper.
  return (
    <div className="dark bg-gray-900 min-h-screen">
      <Suspense fallback={<PageLoadingFallback />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
