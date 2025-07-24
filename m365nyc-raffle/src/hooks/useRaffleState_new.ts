import { useState, useCallback, useMemo } from 'react';
import { TeamData, RaffleRound, Winner, RaffleState } from '@/types/raffle';

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

export const useRaffleState = () => {
  const [state, setState] = useState<RaffleState>({
    teams: [],
    currentRound: 0,
    rounds: DEFAULT_ROUNDS,
    winners: [],
    remainingTeams: [],
    isDrawing: false,
    raffleStarted: false,
    pendingWinner: undefined
  });

  const loadTeamData = useCallback((teams: TeamData[]) => {
    const teamsWithStatus = teams.map(team => ({
      ...team,
      status: 'active' as const
    }));
    
    setState(prev => ({
      ...prev,
      teams: teamsWithStatus,
      remainingTeams: teamsWithStatus,
      currentRound: 0,
      winners: [],
      raffleStarted: false,
      pendingWinner: undefined
    }));
  }, []);

  const startRaffle = useCallback(() => {
    if (state.teams.length === 0) return;
    
    setState(prev => ({
      ...prev,
      raffleStarted: true,
      currentRound: 0,
      remainingTeams: prev.teams.filter(team => team.status === 'active'),
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

      // Update team status to winner and remove from remaining teams
      const updatedRemainingTeams = prev.remainingTeams.map(team => 
        team.Team === prev.pendingWinner 
          ? { ...team, status: 'winner' as const }
          : team
      ).filter(team => team.Team !== prev.pendingWinner);

      const updatedAllTeams = prev.teams.map(team => 
        team.Team === prev.pendingWinner 
          ? { ...team, status: 'winner' as const }
          : team
      );

      return {
        ...prev,
        winners: [...prev.winners, newWinner],
        remainingTeams: updatedRemainingTeams,
        teams: updatedAllTeams,
        currentRound: prev.currentRound + 1,
        pendingWinner: undefined,
        isDrawing: false
      };
    });
  }, []);

  const rejectWinner = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingWinner: undefined,
      isDrawing: false
    }));
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

  const resetRaffle = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentRound: 0,
      winners: [],
      remainingTeams: prev.teams.map(team => ({ ...team, status: 'active' })),
      isDrawing: false,
      raffleStarted: false,
      pendingWinner: undefined
    }));
  }, []);

  const updateRounds = useCallback((newRounds: RaffleRound[]) => {
    setState(prev => ({
      ...prev,
      rounds: newRounds
    }));
  }, []);

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
    const activeTeams = state.remainingTeams.filter(team => team.status === 'active');
    return filterTeamsForRound(activeTeams, currentRoundData);
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
      resetRaffle,
      updateRounds
    },
    computed: {
      canStartRound,
      isRaffleComplete,
      currentRoundData,
      eligibleTeamsForCurrentRound
    }
  };
};
