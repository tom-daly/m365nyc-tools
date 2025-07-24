import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TeamData, RaffleRound, Winner, RaffleState } from '@/types/raffle';
import { RaffleModelType } from '@/types/raffleModels';
import { ConfigurationManager, RoundConfigurationSettings } from '@/utils/configurationManager';

const DEFAULT_ROUNDS: RaffleRound[] = [
  {
    id: 1,
    name: "Round 1",
    pointThreshold: 0,
    description: "All players eligible - First elimination round"
  },
  {
    id: 2,
    name: "Round 2", 
    pointThreshold: 250,
    description: "Players with 250+ points advance"
  },
  {
    id: 3,
    name: "Round 3",
    pointThreshold: 500,
    description: "Players with 500+ points advance"
  },
  {
    id: 4,
    name: "Round 4",
    pointThreshold: 750,
    description: "Players with 750+ points advance"
  },
  {
    id: 5,
    name: "Final Round",
    pointThreshold: 1000,
    description: "Players with 1000+ points - Weighted ticket drawing"
  }
];

// Persistence utilities
const RAFFLE_STATE_KEY = 'raffleState';

const saveStateToStorage = (state: RaffleState) => {
  try {
    if (typeof window === 'undefined') {
      console.log('❌ SAVE: window is undefined (SSR)');
      return;
    }
    
    console.log('💾 SAVE: saveStateToStorage called');
    console.log('💾 SAVE: State details:', {
      raffleStarted: state.raffleStarted,
      teamsLength: state.teams.length,
      currentRound: state.currentRound,
      winnersLength: state.winners.length,
      pendingWinner: !!state.pendingWinner,
      withdrawnPlayersLength: state.withdrawnPlayers?.length || 0
    });
    
    // Persist if raffle has started OR if we have teams loaded (so configuration persists)
    const shouldSave = state.raffleStarted || state.teams.length > 0;
    console.log(`💾 SAVE: shouldSave = ${shouldSave} (raffleStarted: ${state.raffleStarted}, teams.length: ${state.teams.length})`);
    
    if (shouldSave) {
      const stateToSave = JSON.stringify(state);
      console.log(`💾 SAVE: About to save ${stateToSave.length} characters to localStorage`);
      
      // Check localStorage availability
      if (!localStorage) {
        console.error('❌ SAVE: localStorage is not available!');
        return;
      }
      
      localStorage.setItem(RAFFLE_STATE_KEY, stateToSave);
      console.log('✅ SAVE: localStorage.setItem completed');
      
      // Verify it was actually saved
      const verification = localStorage.getItem(RAFFLE_STATE_KEY);
      if (verification) {
        console.log(`✅ SAVE: Verification successful - ${verification.length} characters saved`);
        
        // Parse and verify structure
        try {
          const parsed = JSON.parse(verification);
          console.log('✅ SAVE: JSON parse successful, teams:', parsed.teams?.length || 0);
        } catch (parseError) {
          console.error('❌ SAVE: Verification parse failed:', parseError);
        }
      } else {
        console.error('❌ SAVE: Verification failed - localStorage.getItem returned null');
      }
    } else {
      console.log('❌ SAVE: Skipping save - no active raffle or teams');
    }
  } catch (error) {
    console.error('❌ SAVE: Exception during save:', error);
    console.error('❌ SAVE: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Throttled save function to prevent excessive localStorage writes (removed unused function)

const loadStateFromStorage = (): RaffleState | null => {
  try {
    if (typeof window === 'undefined') {
      console.log('📤 LOAD: window is undefined (SSR)');
      return null;
    }
    
    console.log('📤 LOAD: Attempting to load raffle state from localStorage');
    
    if (!localStorage) {
      console.error('❌ LOAD: localStorage is not available!');
      return null;
    }
    
    const saved = localStorage.getItem(RAFFLE_STATE_KEY);
    console.log(`📤 LOAD: localStorage.getItem returned: ${saved ? `${saved.length} characters` : 'null'}`);
    
    if (saved) {
      console.log('📤 LOAD: Parsing JSON data...');
      const state = JSON.parse(saved);
      
      console.log('📤 LOAD: Successfully parsed state:', {
        raffleStarted: state.raffleStarted,
        teamsLength: state.teams?.length || 0,
        currentRound: state.currentRound,
        winnersLength: state.winners?.length || 0,
        roundsLength: state.rounds?.length || 0
      });
      
      return state;
    } else {
      console.log('📤 LOAD: No saved state found');
    }
  } catch (error) {
    console.error('❌ LOAD: Exception during load:', error);
    console.error('❌ LOAD: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
  return null;
};

const clearStateFromStorage = () => {
  try {
    if (typeof window === 'undefined') {
      console.log('🗑️ CLEAR: window is undefined (SSR)');
      return;
    }
    
    console.log('🗑️ CLEAR: Clearing raffle state from localStorage');
    localStorage.removeItem(RAFFLE_STATE_KEY);
    
    // Verify it was cleared
    const verification = localStorage.getItem(RAFFLE_STATE_KEY);
    if (verification === null) {
      console.log('✅ CLEAR: Raffle state successfully cleared from localStorage');
    } else {
      console.error('❌ CLEAR: Failed to clear - localStorage still contains data');
    }
  } catch (error) {
    console.error('❌ CLEAR: Exception during clear:', error);
  }
};

export const useRaffleState = () => {
  const [state, setState] = useState<RaffleState>(() => {
    console.log('🚀 INIT: useRaffleState initializing...');
    
    // Try to load saved state on initialization
    const savedState = loadStateFromStorage();
    if (savedState) {
      console.log('🔄 INIT: RESTORING RAFFLE STATE FROM LOCALSTORAGE:');
      console.log('- raffleStarted:', savedState.raffleStarted);
      console.log('- currentRound:', savedState.currentRound);
      console.log('- teams:', savedState.teams?.length || 0);
      console.log('- winners:', savedState.winners?.length || 0);
      console.log('- rounds:', savedState.rounds?.length || 0);
      console.log('- withdrawnPlayers:', savedState.withdrawnPlayers?.length || 0);
      
      // Validate the loaded state
      if (!savedState.teams) savedState.teams = [];
      if (!savedState.winners) savedState.winners = [];
      if (!savedState.rounds) savedState.rounds = DEFAULT_ROUNDS;
      if (!savedState.remainingTeams) savedState.remainingTeams = [];
      if (!savedState.withdrawnPlayers) savedState.withdrawnPlayers = [];
      
      console.log('🔄 INIT: State validation completed');
      return savedState;
    }
    // Default state if no saved state
    console.log('🆕 INIT: NO SAVED STATE FOUND - USING DEFAULT STATE');
    const defaultState = {
      teams: [],
      currentRound: 0,
      rounds: DEFAULT_ROUNDS,
      winners: [],
      remainingTeams: [],
      isDrawing: false,
      raffleStarted: false,
      pendingWinner: undefined,
      withdrawnPlayers: []
    };
    console.log('🆕 INIT: Default state created');
    return defaultState;
  });

  // Save state to localStorage whenever it changes (throttled)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCountRef = useRef(0);
  
  useEffect(() => {
    saveCountRef.current += 1;
    const saveNumber = saveCountRef.current;
    
    console.log(`⏰ EFFECT ${saveNumber}: Save effect triggered`);
    console.log(`⏰ EFFECT ${saveNumber}: Current state:`, {
      raffleStarted: state.raffleStarted,
      teamsLength: state.teams.length,
      currentRound: state.currentRound,
      winnersLength: state.winners.length
    });
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      console.log(`⏰ EFFECT ${saveNumber}: Clearing previous timeout`);
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for saving
    console.log(`⏰ EFFECT ${saveNumber}: Setting new save timeout (1 second)`);
    saveTimeoutRef.current = setTimeout(() => {
      console.log(`⏰ TIMEOUT ${saveNumber}: Save timeout fired - calling saveStateToStorage`);
      saveStateToStorage(state);
    }, 1000); // Save at most once per second
    
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        console.log(`⏰ CLEANUP ${saveNumber}: Clearing timeout on cleanup`);
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  const loadTeamData = useCallback((teams: TeamData[], preserveRaffleState: boolean = false) => {
    console.log(`📥 LOAD_TEAMS: Received ${teams.length} teams, preserveRaffleState: ${preserveRaffleState}`);
    
    // Memoized team processing to avoid repeated sorting/mapping
    const processTeams = (inputTeams: TeamData[]) => {
      // Sort teams by points (highest first) and assign player numbers
      const sortedTeams = [...inputTeams].sort((a, b) => b.Points - a.Points);
      
      return sortedTeams.map((team, index) => ({
        ...team,
        playerNumber: index + 1, // Rank 1 = highest points
        status: team.Points === 0 ? 'withdrawn' as const : 'eligible' as const
      }));
    };
    
    const teamsWithStatus = processTeams(teams);
    
    console.log(`📥 LOAD_TEAMS: Processed ${teamsWithStatus.length} teams with status and player numbers`);
    console.log(`📥 LOAD_TEAMS: Top 3 players: #${teamsWithStatus[0]?.playerNumber} ${teamsWithStatus[0]?.Team} (${teamsWithStatus[0]?.Points}pts), #${teamsWithStatus[1]?.playerNumber} ${teamsWithStatus[1]?.Team} (${teamsWithStatus[1]?.Points}pts), #${teamsWithStatus[2]?.playerNumber} ${teamsWithStatus[2]?.Team} (${teamsWithStatus[2]?.Points}pts)`);
    
    setState(prev => {
      console.log(`📥 LOAD_TEAMS: setState called, preserveRaffleState: ${preserveRaffleState}, prev.raffleStarted: ${prev.raffleStarted}`);
      
      if (preserveRaffleState && prev.raffleStarted) {
        // Preserve raffle state - merge new team data with existing statuses
        console.log('📥 LOAD_TEAMS: Preserving raffle state - merging team data with existing statuses');
        
        // Create a map of existing team statuses
        const existingStatuses = new Map<string, any>();
        prev.teams.forEach(team => {
          existingStatuses.set(team.Team, team.status);
        });
        
        // Merge new team data with preserved statuses
        const mergedTeams = teamsWithStatus.map(team => ({
          ...team,
          status: existingStatuses.get(team.Team) || 'eligible' // Preserve existing status or default to eligible
        }));
        
        console.log('📥 LOAD_TEAMS: Merged teams - preserving winner statuses:', mergedTeams.filter(t => t.status === 'winner').map(t => t.Team));
        
        const newState = {
          ...prev,
          teams: mergedTeams,
          // Keep all existing raffle state: remainingTeams, currentRound, winners, raffleStarted, pendingWinner
        };
        console.log('📥 LOAD_TEAMS: Returning preserved state');
        return newState;
      } else {
        // Normal behavior - reset raffle state
        console.log('📥 LOAD_TEAMS: Resetting raffle state (not preserving)');
        const newState = {
          ...prev,
          teams: teamsWithStatus,
          remainingTeams: teamsWithStatus,
          currentRound: 0,
          winners: [],
          raffleStarted: false,
          pendingWinner: undefined
        };
        console.log('📥 LOAD_TEAMS: Returning reset state');
        return newState;
      }
    });
  }, []);

  const startRaffle = useCallback(() => {
    if (state.teams.length === 0) return;
    
    setState(prev => ({
      ...prev,
      raffleStarted: true,
      currentRound: 0,
      remainingTeams: prev.teams.filter(team => team.status === 'eligible'),
      winners: [],
      pendingWinner: undefined
    }));
  }, [state.teams.length]);

  const filterTeamsForRound = useCallback((teams: TeamData[], round: RaffleRound) => {
    return teams.filter(team => team.Points >= round.pointThreshold);
  }, []);

  const selectWinner = useCallback((selectedWinner: string) => {
    setState(prev => ({
      ...prev,
      pendingWinner: selectedWinner,
      isDrawing: false
    }));
  }, []);

  const confirmWinner = useCallback(() => {
    setState(prev => {
      if (!prev.pendingWinner) return prev;

      const currentRoundData = prev.rounds[prev.currentRound];
      const newWinner: Winner = {
        team: prev.pendingWinner,
        round: prev.currentRound + 1,
        roundName: currentRoundData.name,
        prize: `Prize ${prev.winners.length + 1}`
      };

      // Update team status to winner but KEEP them in remainingTeams for visual display
      // They will be filtered out of draws by the eligibleTeamsForCurrentRound logic
      const updatedRemainingTeams = prev.remainingTeams.map(team => 
        team.Team === prev.pendingWinner 
          ? { ...team, status: 'winner' as const }
          : team
      );

      const updatedAllTeams = prev.teams.map(team => 
        team.Team === prev.pendingWinner 
          ? { ...team, status: 'winner' as const }
          : team
      );

      console.log(`CONFIRM WINNER DEBUG: Winner selected: ${prev.pendingWinner}`);
      console.log(`Remaining teams after winner: ${updatedRemainingTeams.length}`);
      console.log(`All teams after winner: ${updatedAllTeams.length}`);

      return {
        ...prev,
        winners: [...prev.winners, newWinner],
        remainingTeams: updatedRemainingTeams, // Keep winner in here for display
        teams: updatedAllTeams,
        currentRound: prev.currentRound + 1,
        pendingWinner: undefined,
        isDrawing: false
      };
    });
  }, []);

  const rejectWinner = useCallback(() => {
    setState(prev => {
      if (!prev.pendingWinner) return prev;
      
      console.log(`🚫 REJECTING WINNER: ${prev.pendingWinner}`);
      console.log(`Adding to withdrawn players list`);
      
      return {
        ...prev,
        withdrawnPlayers: [...prev.withdrawnPlayers, prev.pendingWinner],
        pendingWinner: undefined,
        isDrawing: false
      };
    });
  }, []);

  const conductDraw = useCallback((roundWinner: string) => {
    // This is kept for backward compatibility but now just calls selectWinner
    selectWinner(roundWinner);
  }, [selectWinner]);

  const startDraw = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawing: true
    }));
  }, []);

  const stopDraw = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawing: false
    }));
  }, []);

  const clearPendingWinner = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingWinner: undefined
    }));
  }, []);

  const resetRaffle = useCallback(() => {
    console.log('🔄 RESET: Resetting raffle to initial state');
    setState(prev => {
      const resetTeams = prev.teams.map(team => ({ ...team, status: 'eligible' as const }));
      const newState = {
        ...prev,
        currentRound: 0,
        winners: [],
        teams: resetTeams,
        remainingTeams: resetTeams,
        isDrawing: false,
        raffleStarted: false,
        pendingWinner: undefined,
        withdrawnPlayers: []
      };
      console.log('🔄 RESET: New state created');
      return newState;
    });
    // Clear persisted state when resetting
    console.log('🔄 RESET: Clearing persisted raffle state');
    clearStateFromStorage();
  }, []);

  const updateRounds = useCallback((newRounds: RaffleRound[]) => {
    setState(prev => ({
      ...prev,
      rounds: newRounds
    }));
  }, []);

  const updateRaffleModel = useCallback((modelType: RaffleModelType, numberOfRounds?: number) => {
    setState(prev => {
      // Only allow updates if raffle hasn't started or is at the beginning
      if (prev.raffleStarted && prev.currentRound > 0) {
        console.warn('Cannot change raffle model after rounds have started');
        return prev; // Return unchanged state
      }

      const settings: RoundConfigurationSettings = {
        numberOfRounds: numberOfRounds || prev.rounds.length,
        raffleModel: modelType,
        winnersPerRound: 1
      };

      const newRounds = ConfigurationManager.generateOptimalRounds(prev.teams, settings);
      
      return {
        ...prev,
        rounds: newRounds,
        // Reset round progress if we're changing mid-setup
        currentRound: 0,
        winners: [],
        remainingTeams: prev.teams.filter(team => team.status === 'eligible'),
        pendingWinner: undefined
      };
    });
  }, []); // Empty dependency array to prevent re-creation

  // Computed values
  const canStartRound = useMemo(() => {
    return !state.isDrawing && state.raffleStarted && state.currentRound < state.rounds.length;
  }, [state.isDrawing, state.raffleStarted, state.currentRound, state.rounds.length]);

  const isRaffleComplete = useMemo(() => {
    return state.currentRound >= state.rounds.length || state.remainingTeams.length === 0;
  }, [state.currentRound, state.rounds.length, state.remainingTeams.length]);

  const currentRoundData = useMemo(() => {
    return state.currentRound < state.rounds.length ? state.rounds[state.currentRound] : null;
  }, [state.currentRound, state.rounds]);

  const eligibleTeamsForCurrentRound = useMemo(() => {
    if (!currentRoundData) return [];
    const eligibleTeams = state.remainingTeams.filter(team => team.status === 'eligible');
    return filterTeamsForRound(eligibleTeams, currentRoundData);
  }, [state.remainingTeams, currentRoundData, filterTeamsForRound]);

  return {
    state,
    actions: {
      loadTeamData,
      startRaffle,
      startDraw,
      stopDraw,
      conductDraw,
      selectWinner,
      confirmWinner,
      rejectWinner,
      clearPendingWinner,
      resetRaffle,
      updateRounds,
      updateRaffleModel
    },
    computed: {
      canStartRound,
      isRaffleComplete,
      currentRoundData,
      eligibleTeamsForCurrentRound
    }
  };
};
