import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfigurationsPage from '@/app/configurations/page';
import { useRaffleState } from '@/hooks/useRaffleState';
import { ConfigurationManager } from '@/utils/configurationManager';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock raffle state hook
jest.mock('@/hooks/useRaffleState', () => ({
  useRaffleState: jest.fn(),
}));

// Mock configuration manager
jest.mock('@/utils/configurationManager', () => ({
  ConfigurationManager: {
    getAllConfigurations: jest.fn(),
    getConfiguration: jest.fn(),
    deleteConfiguration: jest.fn(),
  },
}));

// Mock BackToTopButton
jest.mock('@/components/BackToTopButton', () => {
  return function MockBackToTopButton() {
    return <div data-testid="back-to-top">Back to Top</div>;
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockRaffleState = {
  state: {
    teams: [],
    currentRound: 0,
    rounds: [],
    winners: [],
    remainingTeams: [],
    isDrawing: false,
    raffleStarted: false,
    pendingWinner: undefined,
    withdrawnPlayers: []
  },
  actions: {
    resetRaffle: jest.fn(),
    loadTeamData: jest.fn(),
    updateRounds: jest.fn(),
  },
  computed: {}
};

const mockConfiguration = {
  id: 'test-config-1',
  name: 'Test Configuration',
  teams: [
    { Team: 'Team1', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const, playerNumber: 1 },
    { Team: 'Team2', Points: 200, Submissions: 2, 'Last Submission': '2024-01-01', status: 'eligible' as const, playerNumber: 2 },
  ],
  roundSettings: {
    numberOfRounds: 3,
    raffleModel: 'weighted_continuous' as const,
    winnersPerRound: 1,
  },
  rounds: [
    { id: 1, name: 'Round 1', pointThreshold: 0, description: 'All players eligible' },
    { id: 2, name: 'Round 2', pointThreshold: 100, description: 'Players with 100+ points' },
    { id: 3, name: 'Final Round', pointThreshold: 150, description: 'Players with 150+ points' },
  ],
  createdAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-02'),
};

describe('ConfigurationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    
    (useRaffleState as jest.Mock).mockReturnValue(mockRaffleState);
    
    (ConfigurationManager.getAllConfigurations as jest.Mock).mockReturnValue([]);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render configurations page', async () => {
    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Raffle Configurations')).toBeInTheDocument();
      expect(screen.getByText('Manage your saved raffle configurations')).toBeInTheDocument();
    });
  });

  it('should show create new button', async () => {
    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });
  });

  it('should not show reset button when no active raffle', async () => {
    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Reset Raffle')).not.toBeInTheDocument();
    });
  });

  it('should show reset button when raffle is started', async () => {
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
        currentRound: 1,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Reset Raffle')).toBeInTheDocument();
    });
  });

  it('should show reset button when winners exist', async () => {
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        winners: [{ team: 'Team1', round: 1, roundName: 'Round 1', prize: 'Prize 1' }],
        teams: mockConfiguration.teams,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Reset Raffle')).toBeInTheDocument();
    });
  });

  it('should show active raffle indicator when raffle is in progress', async () => {
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
        currentRound: 1,
        winners: [{ team: 'Team1', round: 1, roundName: 'Round 1', prize: 'Prize 1' }],
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Raffle in Progress')).toBeInTheDocument();
      expect(screen.getByText(/Round 2.*1 winners.*2 total participants/)).toBeInTheDocument();
    });
  });

  it('should display saved configurations', async () => {
    (ConfigurationManager.getAllConfigurations as jest.Mock).mockReturnValue([mockConfiguration]);

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Configuration')).toBeInTheDocument();
      expect(screen.getByText(/Weighted Continuous Round.*2 players.*3 rounds/)).toBeInTheDocument();
    });
  });

  it('should show active raffle badge for current configuration with active raffle', async () => {
    (localStorage.getItem as jest.Mock).mockReturnValue('test-config-1');
    (ConfigurationManager.getAllConfigurations as jest.Mock).mockReturnValue([mockConfiguration]);
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Raffle')).toBeInTheDocument();
    });
  });

  it('should open reset confirmation modal when reset button is clicked', async () => {
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      const resetButton = screen.getByText('Reset Raffle');
      fireEvent.click(resetButton);
    });

    expect(screen.getByText('Reset Current Raffle')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to reset the current raffle/)).toBeInTheDocument();
  });

  it('should call resetRaffle when confirmation is confirmed', async () => {
    const mockResetRaffle = jest.fn();
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
      },
      actions: {
        ...mockRaffleState.actions,
        resetRaffle: mockResetRaffle,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      const resetButton = screen.getByText('Reset Raffle');
      fireEvent.click(resetButton);
    });

    const confirmButton = screen.getByRole('button', { name: 'Reset Raffle' });
    fireEvent.click(confirmButton);

    expect(mockResetRaffle).toHaveBeenCalled();
  });

  it('should show switch confirmation modal when switching configurations with active raffle', async () => {
    (localStorage.getItem as jest.Mock).mockReturnValue('other-config');
    (ConfigurationManager.getAllConfigurations as jest.Mock).mockReturnValue([mockConfiguration]);
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: [{ Team: 'OtherTeam', Points: 100, Submissions: 1, 'Last Submission': '2024-01-01', status: 'eligible' as const, playerNumber: 1 }],
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      const configCard = screen.getByText('Test Configuration').closest('div[role="button"], div[class*="cursor-pointer"], button');
      if (configCard) {
        fireEvent.click(configCard);
      }
    });

    expect(screen.getByText('Switch Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Switching to.*Test Configuration.*will clear all current raffle progress/)).toBeInTheDocument();
  });

  it('should handle escape key to close modals', async () => {
    (useRaffleState as jest.Mock).mockReturnValue({
      ...mockRaffleState,
      state: {
        ...mockRaffleState.state,
        raffleStarted: true,
        teams: mockConfiguration.teams,
      }
    });

    render(<ConfigurationsPage />);
    
    await waitFor(() => {
      const resetButton = screen.getByText('Reset Raffle');
      fireEvent.click(resetButton);
    });

    expect(screen.getByText('Reset Current Raffle')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Reset Current Raffle')).not.toBeInTheDocument();
    });
  });
});