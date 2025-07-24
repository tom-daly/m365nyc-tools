import { renderHook, act } from '@testing-library/react';
import { useRaffleState } from '@/hooks/useRaffleState';
import { generateMockTeams, defaultRounds } from './testUtils';

describe('useRaffleState Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRaffleState());
    
    expect(result.current.state).toEqual({
      teams: [],
      currentRound: 0,
      rounds: defaultRounds,
      winners: [],
      remainingTeams: [],
      isDrawing: false,
      raffleStarted: false,
      pendingWinner: undefined,
      withdrawnPlayers: []
    });
  });

  it('should load team data correctly', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(10);

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    expect(result.current.state.teams).toHaveLength(10);
    expect(result.current.state.remainingTeams).toHaveLength(10);
    expect(result.current.state.teams.every(team => team.status === 'eligible')).toBe(true);
  });

  it('should start raffle correctly', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(5);

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    expect(result.current.state.raffleStarted).toBe(true);
    expect(result.current.state.currentRound).toBe(0);
    expect(result.current.computed.canStartRound).toBe(true);
  });

  it('should filter teams correctly for rounds', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = [
      { Team: 'Team1', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      { Team: 'Team2', Points: 300, Submissions: 2, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      { Team: 'Team3', Points: 600, Submissions: 3, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      { Team: 'Team4', Points: 800, Submissions: 4, 'Last Submission': '2024-01-01', status: 'eligible' as const },
      { Team: 'Team5', Points: 1200, Submissions: 5, 'Last Submission': '2024-01-01', status: 'eligible' as const },
    ];

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    // Round 1 (threshold: 0) - all teams eligible
    expect(result.current.computed.eligibleTeamsForCurrentRound).toHaveLength(5);

    // Simulate confirming a winner and moving to round 2
    act(() => {
      result.current.actions.selectWinner('Team1');
    });

    act(() => {
      result.current.actions.confirmWinner();
    });

    // Round 2 (threshold: 250) - teams with 250+ points
    expect(result.current.computed.eligibleTeamsForCurrentRound).toHaveLength(4);
    expect(result.current.computed.eligibleTeamsForCurrentRound.every(team => team.Points >= 250)).toBe(true);
  });

  it('should handle winner selection and confirmation', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(3);

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    const winnerTeam = mockTeams[0].Team;

    // Select winner
    act(() => {
      result.current.actions.selectWinner(winnerTeam);
    });

    expect(result.current.state.pendingWinner).toBe(winnerTeam);

    // Confirm winner
    act(() => {
      result.current.actions.confirmWinner();
    });

    expect(result.current.state.winners).toHaveLength(1);
    expect(result.current.state.winners[0].team).toBe(winnerTeam);
    expect(result.current.state.currentRound).toBe(1);
    expect(result.current.state.pendingWinner).toBeUndefined();
    
    // Winner should still be in remaining teams but marked as winner
    const winnerInRemaining = result.current.state.remainingTeams.find(team => team.Team === winnerTeam);
    expect(winnerInRemaining).toBeDefined();
    expect(winnerInRemaining?.status).toBe('winner');
    
    // Winner should have status updated in main teams array
    const winnerInTeams = result.current.state.teams.find(team => team.Team === winnerTeam);
    expect(winnerInTeams?.status).toBe('winner');
  });

  it('should handle winner rejection', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(3);

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    const winnerTeam = mockTeams[0].Team;

    // Select and reject winner
    act(() => {
      result.current.actions.selectWinner(winnerTeam);
    });

    act(() => {
      result.current.actions.rejectWinner();
    });

    expect(result.current.state.pendingWinner).toBeUndefined();
    expect(result.current.state.winners).toHaveLength(0);
    expect(result.current.state.currentRound).toBe(0);
    
    // Team should still be available for selection
    expect(result.current.state.remainingTeams.find(team => team.Team === winnerTeam)).toBeDefined();
  });

  it('should reset raffle correctly', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(5);

    // Setup raffle with winners
    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    act(() => {
      result.current.actions.selectWinner(mockTeams[0].Team);
    });

    act(() => {
      result.current.actions.confirmWinner();
    });

    // Reset raffle
    act(() => {
      result.current.actions.resetRaffle();
    });

    expect(result.current.state.currentRound).toBe(0);
    expect(result.current.state.winners).toHaveLength(0);
    expect(result.current.state.raffleStarted).toBe(false);
    expect(result.current.state.pendingWinner).toBeUndefined();
    expect(result.current.state.teams.every(team => team.status === 'eligible')).toBe(true);
    expect(result.current.state.remainingTeams).toHaveLength(mockTeams.length);
    expect(result.current.state.withdrawnPlayers).toHaveLength(0);
  });

  it('should detect raffle completion', () => {
    const { result } = renderHook(() => useRaffleState());
    const mockTeams = generateMockTeams(2);

    act(() => {
      result.current.actions.loadTeamData(mockTeams);
    });

    act(() => {
      result.current.actions.startRaffle();
    });

    expect(result.current.computed.isRaffleComplete).toBe(false);

    // Complete all rounds or eliminate all teams
    for (let i = 0; i < defaultRounds.length && result.current.state.remainingTeams.length > 0; i++) {
      if (result.current.computed.eligibleTeamsForCurrentRound.length > 0) {
        act(() => {
          result.current.actions.selectWinner(result.current.computed.eligibleTeamsForCurrentRound[0].Team);
        });

        act(() => {
          result.current.actions.confirmWinner();
        });
      }
    }

    expect(result.current.computed.isRaffleComplete).toBe(true);
  });

  it('should update rounds configuration', () => {
    const { result } = renderHook(() => useRaffleState());
    const newRounds = [
      { id: 1, name: 'Custom Round 1', pointThreshold: 0, description: 'Custom description' },
      { id: 2, name: 'Custom Round 2', pointThreshold: 500, description: 'Custom description 2' },
    ];

    act(() => {
      result.current.actions.updateRounds(newRounds);
    });

    expect(result.current.state.rounds).toEqual(newRounds);
  });

  describe('Raffle State Detection', () => {
    it('should detect active raffle with raffleStarted true', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      const hasActiveRaffle = result.current.state.raffleStarted || 
        result.current.state.winners.length > 0 || 
        result.current.state.currentRound > 0;
      
      expect(hasActiveRaffle).toBe(true);
    });

    it('should detect active raffle with winners present', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      act(() => {
        result.current.actions.selectWinner(mockTeams[0].Team);
      });

      act(() => {
        result.current.actions.confirmWinner();
      });

      const hasActiveRaffle = result.current.state.raffleStarted || 
        result.current.state.winners.length > 0 || 
        result.current.state.currentRound > 0;
      
      expect(hasActiveRaffle).toBe(true);
      expect(result.current.state.winners.length).toBe(1);
    });

    it('should detect active raffle with advanced round', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      act(() => {
        result.current.actions.selectWinner(mockTeams[0].Team);
      });

      act(() => {
        result.current.actions.confirmWinner();
      });

      const hasActiveRaffle = result.current.state.raffleStarted || 
        result.current.state.winners.length > 0 || 
        result.current.state.currentRound > 0;
      
      expect(hasActiveRaffle).toBe(true);
      expect(result.current.state.currentRound).toBe(1);
    });

    it('should not detect active raffle in initial state', () => {
      const { result } = renderHook(() => useRaffleState());
      
      const hasActiveRaffle = result.current.state.raffleStarted || 
        result.current.state.winners.length > 0 || 
        result.current.state.currentRound > 0;
      
      expect(hasActiveRaffle).toBe(false);
    });

    it('should not detect active raffle after reset', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      // Setup active raffle
      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      act(() => {
        result.current.actions.selectWinner(mockTeams[0].Team);
      });

      act(() => {
        result.current.actions.confirmWinner();
      });

      // Reset raffle
      act(() => {
        result.current.actions.resetRaffle();
      });

      const hasActiveRaffle = result.current.state.raffleStarted || 
        result.current.state.winners.length > 0 || 
        result.current.state.currentRound > 0;
      
      expect(hasActiveRaffle).toBe(false);
    });
  });

  describe('Withdrawn Players', () => {
    it('should handle withdrawn players when rejecting winners', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      const winnerTeam = mockTeams[0].Team;

      // Select and reject winner
      act(() => {
        result.current.actions.selectWinner(winnerTeam);
      });

      act(() => {
        result.current.actions.rejectWinner();
      });

      expect(result.current.state.withdrawnPlayers).toContain(winnerTeam);
      expect(result.current.state.pendingWinner).toBeUndefined();
    });

    it('should reset withdrawn players when resetting raffle', () => {
      const { result } = renderHook(() => useRaffleState());
      const mockTeams = generateMockTeams(3);

      act(() => {
        result.current.actions.loadTeamData(mockTeams);
      });

      act(() => {
        result.current.actions.startRaffle();
      });

      // Reject a winner to add to withdrawn players
      act(() => {
        result.current.actions.selectWinner(mockTeams[0].Team);
      });

      act(() => {
        result.current.actions.rejectWinner();
      });

      expect(result.current.state.withdrawnPlayers).toHaveLength(1);

      // Reset raffle
      act(() => {
        result.current.actions.resetRaffle();
      });

      expect(result.current.state.withdrawnPlayers).toHaveLength(0);
    });
  });
});
