import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TeamData } from '@/types/raffle';
import SquidGameUserPhoto from './SquidGameUserPhoto';
import { getSquidGamePhotoPath, getFallbackAvatar } from '@/utils/photoUtils';
import seedrandom from 'seedrandom';

/**
 * Represents a ticket/player in the raffle grid
 * Each ticket corresponds to one team/player with their display information
 */
interface Ticket {
  id: string; // Unique identifier for the ticket (team name)
  teamName: string; // Display name of the team/player
  playerNumber: string; // 3-digit formatted player number for display
  position: { row: number; col: number }; // Grid position for display layout
  ticketCount?: number; // Number of tickets this person has (for weighted selection)
  isEliminated?: boolean; // Whether this player has been eliminated from current session
  isWinner?: boolean; // Track winners separately from elimination status
}

/**
 * Animation states for the raffle drawing process
 * Controls the visual feedback and timing of the selection animation
 */
type RaffleState = 'idle' | 'spinning' | 'slowing' | 'complete';

/**
 * Props interface for the SquidGameAnimation component
 * Defines all the data and callbacks needed for the raffle animation
 */
interface SquidGameAnimationProps {
  teams: TeamData[]; // Currently eligible teams for selection in this round
  allTeams?: TeamData[]; // All original teams for display (includes winners and eliminated)
  isSpinning: boolean; // Whether the raffle animation should be running
  previousWinners?: string[]; // Previous winners from earlier rounds (orange overlay)
  withdrawnPlayers?: string[]; // Players who were withdrawn after being selected (red X)
  onWinner: (winner: string) => void; // Callback when a winner is selected
  onSpinComplete: () => void; // Callback when the spin animation completes
  onClose: () => void; // Callback to close the animation view
}

/**
 * SquidGameAnimation Component
 * 
 * A comprehensive raffle animation component that displays participants in a grid layout
 * similar to Squid Game's visual style. Handles weighted random selection, visual animations,
 * winner management, and player status tracking.
 * 
 * Key Features:
 * - Grid-based display of all participants with photos
 * - Weighted random selection based on ticket counts
 * - Visual animation during selection process
 * - Color-coded overlays for different player states
 * - Support for winner withdrawal and re-drawing
 * - Responsive grid layout optimization
 */
const SquidGameAnimation: React.FC<SquidGameAnimationProps> = ({
  teams,
  allTeams,
  isSpinning,
  previousWinners = [], // Default to empty array if not provided
  withdrawnPlayers = [], // Default to empty array if not provided
  onWinner,
  onSpinComplete,
  onClose
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  /** Array of all ticket objects representing players in the grid */
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  /** Grid dimensions for optimal display layout */
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  
  /** Currently selected winner (green overlay with bounce animation) */
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  
  /** Current state of the raffle animation process */
  const [raffleState, setRaffleState] = useState<RaffleState>('idle');
  
  /** Player currently highlighted during animation cycling */
  const [currentHighlight, setCurrentHighlight] = useState<string | null>(null);
  
  /** Complete list of all winners (current + previous) for orange overlay display */
  const [winners, setWinners] = useState<string[]>(previousWinners);
  
  /** Players eliminated during current session (do not persist across reloads) */
  const [eliminated, setEliminated] = useState<string[]>([]);
  
  /** Players withdrawn during current session (do not persist across reloads) */
  const [withdrawn, setWithdrawn] = useState<string[]>([]);

  /** Reference to current animation timeout for cleanup */
  const [raffleAnimationRef, setRaffleAnimationRef] = useState<NodeJS.Timeout | null>(null);
  
  /** Current player number being displayed during spinning animation */
  const [currentSpinNumber, setCurrentSpinNumber] = useState<string>('001');

  /** Track image loading state for all participants */
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  /** Audio elements for sound effects */
  const [clickSound, setClickSound] = useState<HTMLAudioElement | null>(null);
  const [winnerSound, setWinnerSound] = useState<HTMLAudioElement | null>(null);

  /** Sound throttling to prevent audio overlap */
  const [lastBeepTime, setLastBeepTime] = useState<number>(0);

  // =============================================================================
  // AUDIO UTILITIES
  // =============================================================================

  /**
   * Initialize audio elements on component mount
   * Pre-load audio files for better performance during animation
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize click sound for raffle cycling
      const click = new Audio('/sounds/beep.mp3');
      click.volume = 0.6; // Increased volume for better audibility
      click.preload = 'auto';
      click.load(); // Force load
      setClickSound(click);

      // Initialize winner sound for final selection (same beep as cycling)
      const winner = new Audio('/sounds/beep.mp3');
      winner.volume = 0.64; // 20% reduction from 0.8 (0.8 * 0.8 = 0.64)
      winner.preload = 'auto';
      winner.load(); // Force load
      setWinnerSound(winner);

      console.log('🔊 Audio initialized:', { 
        beepSrc: click.src, 
        beepVolume: click.volume,
        winnerSrc: winner.src,
        winnerVolume: winner.volume
      });
    }

    // Cleanup audio elements on unmount
    return () => {
      if (clickSound) {
        clickSound.pause();
        clickSound.src = '';
      }
      if (winnerSound) {
        winnerSound.pause();
        winnerSound.src = '';
      }
    };
  }, []);

  /**
   * Play click sound with error handling and throttling
   * Used for each player tile highlight during animation
   */
  const playClickSound = useCallback(() => {
    const now = Date.now();
    
    // Throttle beeps to every 100ms to prevent audio overlap
    if (now - lastBeepTime < 100) {
      return;
    }
    
    if (clickSound) {
      try {
        clickSound.currentTime = 0; // Reset to beginning for rapid fire
        const playPromise = clickSound.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 Beep played successfully');
              setLastBeepTime(now);
            })
            .catch(err => {
              console.log('🔇 Click sound play failed (browser policy):', err);
            });
        }
      } catch (error) {
        console.log('🔇 Click sound error:', error);
      }
    } else {
      console.log('🔇 Click sound not initialized');
    }
  }, [clickSound, lastBeepTime]);

  /**
   * Play winner sound for final selection
   * Used when the winner is determined
   */
  const playWinnerSound = useCallback(() => {
    if (winnerSound) {
      try {
        winnerSound.currentTime = 0; // Reset to beginning
        const playPromise = winnerSound.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 Winner sound played successfully');
            })
            .catch(err => {
              console.log('🔇 Winner sound play failed (browser policy):', err);
            });
        }
      } catch (error) {
        console.log('🔇 Winner sound error:', error);
      }
    } else {
      console.log('🔇 Winner sound not initialized');
    }
  }, [winnerSound]);


  // =============================================================================
  // RANDOM NUMBER GENERATION & UTILITIES
  // =============================================================================

  /** 
   * Stable RNG seed to prevent re-renders and ensure consistent randomization
   * Generated once and reused throughout component lifecycle
   * Use deterministic seed to prevent hydration mismatch
   */
  const rngSeed = useMemo(() => {
    // Use a deterministic seed based on teams to prevent hydration mismatch
    if (teams.length > 0) {
      const teamNames = teams.map(t => t.Team).join('');
      return teamNames.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) / 1000;
    }
    return 0.5; // Fallback seed
  }, [teams]);
  
  /** 
   * High-quality pseudorandom number generator using seedrandom library
   * Provides better randomization than Math.random() for fair selection
   */
  const rng = useMemo(() => {
    return seedrandom(rngSeed.toString());
  }, [rngSeed]);

  /**
   * Fisher-Yates shuffle algorithm implementation using high-quality RNG
   * Ensures truly random and unbiased shuffling of arrays
   * @param array - Array to shuffle (creates copy, doesn't mutate original)
   * @returns Shuffled copy of the input array
   */
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [rng]);

  // =============================================================================
  // EFFECT HOOKS - STATE SYNCHRONIZATION
  // =============================================================================

  /**
   * Debug effect to track withdrawn state changes
   * Helps with troubleshooting withdrawal functionality
   */
  useEffect(() => {
    console.log(`🚫 WITHDRAWN STATE CHANGED 🚫`);
    console.log(`Current withdrawn array:`, withdrawn);
    console.log(`External withdrawnPlayers prop:`, withdrawnPlayers);
    console.log(`Combined withdrawn count: ${withdrawn.length + withdrawnPlayers.length}`);
    console.log(`===============================`);
  }, [withdrawn, withdrawnPlayers]);

  /**
   * Synchronizes internal state with external props for winners and withdrawn players
   * Handles raffle resets (when previousWinners becomes empty) and merges external data
   */
  useEffect(() => {
    console.log(`🔄 PREVIOUS WINNERS & WITHDRAWN PROP UPDATE 🔄`);
    console.log(`Received previousWinners:`, previousWinners);
    console.log(`Received withdrawnPlayers:`, withdrawnPlayers);
    
    // If previousWinners is empty, it means raffle was reset - clear everything
    if (previousWinners.length === 0) {
      console.log(`Raffle reset detected - clearing winners, withdrawn, and eliminated`);
      setWinners([]);
      setWithdrawn([]);
      setEliminated([]);
    } else {
      console.log(`Setting winners to:`, previousWinners);
      setWinners(previousWinners);
      
      // Merge external withdrawnPlayers with current withdrawn state (avoiding duplicates)
      setWithdrawn(prev => {
        const combined = [...new Set([...prev, ...withdrawnPlayers])];
        console.log(`Updated withdrawn from external prop:`, combined);
        return combined;
      });
    }
    console.log(`===============================`);
  }, [previousWinners, withdrawnPlayers]); // Depend on both props

  /**
   * Image preloading effect - ensures all participant photos are loaded before starting raffle
   * Tracks individual image load states and updates allImagesLoaded flag
   */
  useEffect(() => {
    if (!allTeams || allTeams.length === 0) return;

    const loadImage = (teamName: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        const photoPath = getSquidGamePhotoPath(teamName);
        
        img.onload = () => {
          setImagesLoaded(prev => new Set(prev.add(teamName)));
          resolve();
        };
        
        img.onerror = () => {
          // Even on error, mark as "loaded" so we don't block the raffle
          // Fallback avatars will be shown instead
          setImagesLoaded(prev => new Set(prev.add(teamName)));
          resolve();
        };
        
        img.src = photoPath || getFallbackAvatar(teamName);
      });
    };

    // Start loading all images
    const loadAllImages = async () => {
      console.log('🖼️ Starting to preload all participant images...');
      const loadPromises = allTeams.map(team => loadImage(team.Team));
      
      try {
        await Promise.all(loadPromises);
        console.log('✅ All participant images loaded successfully');
        setAllImagesLoaded(true);
      } catch (error) {
        console.error('❌ Error loading some images, but continuing anyway:', error);
        setAllImagesLoaded(true); // Continue anyway
      }
    };

    loadAllImages();
  }, [allTeams]);

  /**
   * Reset image loading state when teams change
   */
  useEffect(() => {
    setImagesLoaded(new Set());
    setAllImagesLoaded(false);
  }, [teams, allTeams]);

  /**
   * Main effect for generating tickets and calculating optimal grid layout
   * Runs when team data, winners, or player status changes
   * 
   * Key responsibilities:
   * - Creates ticket objects for all teams (eligible + previous winners)
   * - Calculates optimal grid dimensions for responsive display
   * - Assigns grid positions to each ticket
   * - Updates ticket status based on current state arrays
   */
  useEffect(() => {
    const displayTeams = allTeams || teams; // Use allTeams if provided, otherwise use teams
    if (displayTeams.length === 0) return;

    console.log(`SquidGame: Processing ${displayTeams.length} teams for display`);
    console.log(`🔍 WINNER STATE DEBUG 🔍`);
    console.log(`Current winners array:`, winners);
    console.log(`Current eliminated array:`, eliminated);
    console.log(`Current withdrawn array:`, withdrawn);
    console.log(`UseEffect triggered - dependencies changed`);

    // Create tickets for ALL teams (both eligible and winners)
    const allTickets: Ticket[] = [];
    const eligibleTeamNames = teams.map(t => t.Team); // Only currently eligible teams can be selected
    
    displayTeams.forEach((team) => {
      const actualTicketCount = Math.floor(team.Points / 100);
      const isAutoWithdrawn = actualTicketCount === 0; // Players with 0 tickets are auto-withdrawn
      
      // Use the playerNumber from TeamData if available, otherwise fall back to ranking by points
      const playerNumber = team.playerNumber 
        ? String(team.playerNumber).padStart(3, '0')
        : String(displayTeams.sort((a, b) => b.Points - a.Points).findIndex(t => t.Team === team.Team) + 1).padStart(3, '0');
      
      const isEligible = eligibleTeamNames.includes(team.Team);
      const isCurrentWinner = winners.includes(team.Team);
      const isCurrentEliminated = eliminated.includes(team.Team);
      const isCurrentWithdrawn = withdrawn.includes(team.Team);
      
      console.log(`🎫 TICKET CREATION DEBUG for ${team.Team}:`);
      console.log(`  - Player #${playerNumber}`);
      console.log(`  - Status: ${team.status}`);
      console.log(`  - Actual ticket count: ${actualTicketCount}`);
      console.log(`  - Auto-withdrawn (0 tickets): ${isAutoWithdrawn}`);
      console.log(`  - Eligible: ${isEligible}`);
      console.log(`  - Is in winners array: ${isCurrentWinner}`);
      console.log(`  - Is in eliminated array: ${isCurrentEliminated}`);
      console.log(`  - Is in withdrawn array: ${isCurrentWithdrawn}`);
      console.log(`  - Will set isWinner: ${isCurrentWinner}`);
      console.log(`  - Will set isEliminated: ${isCurrentEliminated || isCurrentWithdrawn || isAutoWithdrawn}`);
      
      allTickets.push({
        id: team.Team,
        teamName: team.Team,
        playerNumber: playerNumber,
        position: { row: 0, col: 0 },
        ticketCount: actualTicketCount, // Use actual ticket count, not minimum 1
        isWinner: isCurrentWinner,
        isEliminated: isCurrentEliminated || isCurrentWithdrawn || isAutoWithdrawn // Include auto-withdrawn
      });
    });

    // Sort tickets by player number to maintain consistent positioning
    const sortedTickets = allTickets.sort((a, b) => a.playerNumber.localeCompare(b.playerNumber));
    const totalPeople = sortedTickets.length;
    
    // Get viewport dimensions
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const headerHeight = 60;
    const padding = 16;
    const gap = 4;
    
    const availableWidth = viewportWidth - padding;
    const availableHeight = viewportHeight - headerHeight - padding;
    
    
    /**
     * Helper function to calculate optimal grid dimensions for responsive display
     * Tries different column counts to find the configuration that maximizes cell size
     * while fitting all items within the available viewport space
     */
    const calculateOptimalGrid = (totalItems: number, availableWidth: number, availableHeight: number) => {
      let bestCellSize = 0;
      let bestCols = 0;
      let bestRows = 0;
      
      // Try different column counts to find the one that gives the largest cell size
      for (let cols = 1; cols <= totalItems; cols++) {
        const rows = Math.ceil(totalItems / cols);
        
        // Calculate cell size for this configuration
        const cellWidth = Math.floor((availableWidth - (cols - 1) * gap) / cols);
        const cellHeight = Math.floor((availableHeight - (rows - 1) * gap) / rows);
        const cellSize = Math.min(cellWidth, cellHeight);
        
        // Only consider valid configurations where all items fit
        if (cellSize > 0 && cols * rows >= totalItems && cellSize > bestCellSize) {
          bestCellSize = cellSize;
          bestCols = cols;
          bestRows = rows;
        }
      }
      
      return { cols: bestCols, rows: bestRows, cellSize: bestCellSize };
    };
    
    const { cols: finalCols, rows: finalRows } = calculateOptimalGrid(totalPeople, availableWidth, availableHeight);
    
    console.log('Optimal grid calculation:', { 
      totalPeople, 
      finalCols, 
      finalRows, 
      availableWidth, 
      availableHeight 
    });
    
    // Assign simple grid positions - left to right, top to bottom
    const ticketsWithPositions = sortedTickets.map((ticket, index) => {
      const row = Math.floor(index / finalCols);
      const col = index % finalCols;
      
      return {
        ...ticket,
        position: { row, col }
      };
    });

    setTickets(ticketsWithPositions);
    setGridSize({ rows: finalRows, cols: finalCols });
    
    console.log(`🎟️ FINAL TICKETS STATE:`);
    ticketsWithPositions.forEach(ticket => {
      if (ticket.isWinner || winners.includes(ticket.teamName)) {
        console.log(`  Winner ticket: ${ticket.teamName} - isWinner: ${ticket.isWinner}`);
      }
    });
    console.log(`===============================`);
  }, [teams, allTeams, winners, eliminated, withdrawn]);

  /**
   * Cleanup effect to clear animation timeouts when component unmounts
   * Prevents memory leaks and ensures clean teardown
   */
  useEffect(() => {
    return () => {
      if (raffleAnimationRef) {
        clearTimeout(raffleAnimationRef);
      }
    };
  }, [raffleAnimationRef]);

  // =============================================================================
  // CORE ANIMATION FUNCTIONS
  // =============================================================================

  /**
   * Main lottery animation function that handles the spinning selection process
   * 
   * Process:
   * 1. Filters eligible participants (not winners, withdrawn, or eliminated)
   * 2. Creates weighted ticket pool based on participant ticket counts
   * 3. Runs visual animation with speed phases (fast -> medium -> slow)
   * 4. Selects final winner using weighted random selection
   * 5. Handles edge cases (duplicate winners, withdrawals)
   * 6. Triggers callbacks and state updates
   */
  const startLotteryAnimation = useCallback(() => {
    if (tickets.length === 0) return;
    
    // Get eligible participants (only teams that are currently in the eligible list AND not previous winners, withdrawn, or eliminated)
    const eligibleTeamNames = teams.map(t => t.Team);
    const eligibleTickets = tickets.filter(ticket => 
      eligibleTeamNames.includes(ticket.teamName) && 
      !winners.includes(ticket.teamName) && 
      !withdrawn.includes(ticket.teamName) && 
      !withdrawnPlayers.includes(ticket.teamName) && 
      !eliminated.includes(ticket.teamName) &&
      ticket.ticketCount && ticket.ticketCount > 0 // Exclude players with 0 tickets
    );
    
    if (eligibleTickets.length === 0) {
      console.log('No eligible participants remaining');
      return;
    }

    // Create thoroughly shuffled weighted array for selection (only eligible teams)
    const weightedTickets: string[] = [];
    eligibleTickets.forEach(ticket => {
      const count = ticket.ticketCount || 1;
      for (let i = 0; i < count; i++) {
        weightedTickets.push(ticket.teamName);
      }
    });
    
    // Enhanced 10x shuffle passes for maximum randomness
    let shuffledWeightedTickets = shuffleArray(weightedTickets);
    for (let i = 0; i < 10; i++) {
      shuffledWeightedTickets = shuffleArray(shuffledWeightedTickets);
      console.log(`🔀 Shuffle pass ${i + 1}/10: First 5 tickets: [${shuffledWeightedTickets.slice(0, 5).join(', ')}]`);
    }
    
    // Create array of all eligible ticket numbers for visual cycling
    const eligiblePlayerNumbers = eligibleTickets.map(ticket => ticket.playerNumber);
    const shuffledPlayerNumbers = shuffleArray([...eligiblePlayerNumbers]);

    console.log(`🎰 RAFFLE SELECTION DEBUG 🎰`);
    console.log(`Eligible teams: ${eligibleTickets.length}`);
    console.log(`Eligible team names:`, eligibleTickets.map(t => `#${t.playerNumber} ${t.teamName} (${t.ticketCount} tickets)`));
    console.log(`Total weighted tickets in pool: ${weightedTickets.length}`);
    console.log(`Shuffled player numbers for animation:`, shuffledPlayerNumbers);
    console.log(`First 10 weighted tickets:`, shuffledWeightedTickets.slice(0, 10));
    console.log(`🎫 RAFFLE ARRAY BY PLAYER NUMBER:`);
    eligibleTickets
      .sort((a, b) => a.playerNumber.localeCompare(b.playerNumber))
      .forEach(ticket => {
        console.log(`  Player #${ticket.playerNumber}: ${ticket.teamName} (${ticket.ticketCount} tickets)`);
      });
    console.log(`===============================`);

    setRaffleState('spinning');
    let animationSpeed = 100; // Start slower (100ms instead of 25ms)
    let elapsed = 0;
    const totalDuration = 7000; // 7 seconds total (longer for more dramatic ending)
    let playerNumberIndex = 0;

    /**
     * Inner animation function that runs the visual cycling and timing
     * Handles different animation phases with progressive speed reduction
     */
    const animate = () => {
      if (elapsed >= totalDuration) {
        // Animation complete - select final winner
        const randomSeed = Math.floor(rng() * 999999999); // Very high random number
        const randomIndex = randomSeed % shuffledWeightedTickets.length;
        let finalWinnerId = shuffledWeightedTickets[randomIndex];
        
        console.log(`🎯 FINAL SELECTION DEBUG 🎯`);
        console.log(`Random index selected: ${randomIndex} out of ${shuffledWeightedTickets.length} total tickets`);
        console.log(`Selected ticket: "${finalWinnerId}"`);
        console.log(`Is previous winner: ${winners.includes(finalWinnerId)}`);
        
        // Check if this winner was already a winner (previous winner drawn again)
        if (winners.includes(finalWinnerId)) {
          // This is a previous winner being drawn again - mark as withdrawn/eliminated
          console.log(`❌ ${finalWinnerId} was already a winner - marking as withdrawn and redrawing`);
          setEliminated(prev => [...prev, finalWinnerId]);
          // Note: No need to update tickets directly since we compute status from state arrays during render
          
          // Continue drawing until we get a new winner (not a previous winner)
          let attempts = 0;
          const maxAttempts = 50; // Prevent infinite loop
          console.log(`🔄 Redrawing for new winner...`);
          while (winners.includes(finalWinnerId) && attempts < maxAttempts) {
            const newRandomIndex = Math.floor(rng() * shuffledWeightedTickets.length);
            finalWinnerId = shuffledWeightedTickets[newRandomIndex];
            attempts++;
            console.log(`  Attempt ${attempts}: Index ${newRandomIndex} -> "${finalWinnerId}" (Previous winner: ${winners.includes(finalWinnerId)})`);
          }
          
          if (attempts >= maxAttempts) {
            console.log('❌ No new winners available - all eligible participants are previous winners');
            setRaffleState('idle');
            return;
          }
          console.log(`✅ New winner found after ${attempts} attempts: "${finalWinnerId}"`);
        }
        
        console.log(`🏆 FINAL WINNER: "${finalWinnerId}"`);
        console.log(`Winner's player number: #${eligibleTickets.find(t => t.teamName === finalWinnerId)?.playerNumber}`);
        console.log(`===============================`);
        
        
        // Set the final winner (guaranteed to be a new winner)
        setCurrentHighlight(finalWinnerId);
        setSelectedWinner(finalWinnerId);
        setRaffleState('complete');
        
        // Play winner sound immediately
        playWinnerSound();
        
        console.log(`🏆 SETTING NEW WINNER 🏆`);
        console.log(`Previous winners:`, winners);
        console.log(`Adding new winner: "${finalWinnerId}"`);
        
        // Add new winner to winners list
        setWinners(prev => {
          const newWinners = [...prev, finalWinnerId];
          console.log(`Updated winners array:`, newWinners);
          return newWinners;
        });
        // Note: No need to update tickets directly since we compute isWinner from winners array during render

        // Wait 3 seconds on the winner before calling onWinner
        setTimeout(() => {
          onWinner(finalWinnerId);
          setTimeout(() => {
            onSpinComplete();
            setRaffleState('idle');
            setCurrentHighlight(null);
          }, 2000);
        }, 3000); // 3 second delay as requested
        
        return;
      }

      // Calculate easing - very fast start, gradual slowdown to very slow
      const progress = elapsed / totalDuration;
      
      // Enhanced phase-based animation speeds with more dramatic slowdown
      if (progress < 0.4) {
        // Phase 1: Medium start (0-2.8s)
        animationSpeed = 100; // Start at 100ms
        setRaffleState('spinning');
      } else if (progress < 0.7) {
        // Phase 2: Gradual slowdown (2.8-4.9s) 
        const phaseProgress = (progress - 0.4) / 0.3;
        animationSpeed = 100 + (phaseProgress * 150); // 100ms to 250ms
        setRaffleState('spinning');
      } else if (progress < 0.9) {
        // Phase 3: Slower (4.9-6.3s)
        const phaseProgress = (progress - 0.7) / 0.2;
        animationSpeed = 250 + (phaseProgress * 350); // 250ms to 600ms
        setRaffleState('slowing');
      } else {
        // Phase 4: Very dramatic ending (6.3-7s)
        const phaseProgress = (progress - 0.9) / 0.1;
        animationSpeed = 600 + (phaseProgress * 900); // 600ms to 1500ms (very very slow)
        setRaffleState('slowing');
      }

      // Highlight random eligible participant
      const randomIndex = Math.floor(rng() * 999999999); // Very high random number
      const finalIndex = randomIndex % shuffledWeightedTickets.length;
      const randomId = shuffledWeightedTickets[finalIndex];
      setCurrentHighlight(randomId);
      
      // Play click sound for each cycle
      playClickSound();
      
      // Update spinning number display
      const currentPlayerNumber = shuffledPlayerNumbers[playerNumberIndex % shuffledPlayerNumbers.length];
      setCurrentSpinNumber(currentPlayerNumber);
      
      // Log cycling every 500ms during spinning phase
      if (raffleState === 'spinning' && playerNumberIndex % 20 === 0) {
        console.log(`🎲 Animation cycling: Player #${currentPlayerNumber} -> ${randomId} (Speed: ${animationSpeed}ms, Progress: ${(progress * 100).toFixed(1)}%)`);
      }
      
      playerNumberIndex++;

      elapsed += animationSpeed;

      // Continue animation
      const timeoutId = setTimeout(animate, animationSpeed);
      setRaffleAnimationRef(timeoutId);
    };

    animate();
  }, [tickets, teams, rng, onWinner, onSpinComplete, shuffleArray, winners, withdrawn, withdrawnPlayers, eliminated, raffleState, playWinnerSound]);

  /**
   * Effect to trigger raffle animation when spinning begins
   * Waits for grid to be ready and adds delay for visual preparation
   */
  useEffect(() => {
    console.log(`🎪 RAFFLE STATE UPDATE 🎪`);
    console.log(`IsSpinning: ${isSpinning}, Tickets: ${tickets.length}, Grid: ${gridSize.rows}x${gridSize.cols}, RaffleState: ${raffleState}`);
    console.log(`Current winners: [${winners.join(', ')}]`);
    console.log(`Current eliminated: [${eliminated.join(', ')}]`);
    console.log(`Current withdrawn: [${withdrawn.join(', ')}]`);
    console.log(`===============================`);
    
    if (isSpinning && tickets.length > 0 && gridSize.rows > 0 && gridSize.cols > 0 && raffleState === 'idle' && allImagesLoaded) {
      console.log('SquidGame: All images loaded, starting lottery animation with delay');
      setSelectedWinner(null);
      setCurrentHighlight(null);
      
      // Add a delay to ensure the grid is fully rendered and user can see it
      setTimeout(() => {
        startLotteryAnimation();
      }, 1500); // 1.5 second delay since images are already loaded
    } else if (isSpinning && !allImagesLoaded) {
      console.log('SquidGame: Waiting for images to load before starting raffle...');
    }
  }, [isSpinning, tickets.length, gridSize.rows, gridSize.cols, raffleState, startLotteryAnimation, winners, eliminated, withdrawn, allImagesLoaded]);

  // =============================================================================
  // USER INTERACTION HANDLERS
  // =============================================================================

  /**
   * Manual winner selection function (fallback/testing)
   * Performs immediate weighted random selection without animation
   * Used when automatic animation fails or for testing purposes
   */
  const handlePickWinner = useCallback(() => {
    if (tickets.length === 0) return;
    
    // Create weighted selection based on eligible teams only (not previous winners, withdrawn, or eliminated)
    const eligibleTeamNames = teams.map(t => t.Team);
    const activeTickets = tickets.filter(ticket => 
      eligibleTeamNames.includes(ticket.teamName) && 
      !winners.includes(ticket.teamName) && 
      !withdrawn.includes(ticket.teamName) && 
      !withdrawnPlayers.includes(ticket.teamName) && 
      !eliminated.includes(ticket.teamName) &&
      ticket.ticketCount && ticket.ticketCount > 0 // Exclude players with 0 tickets
    );
    const weightedTickets: string[] = [];
    activeTickets.forEach(ticket => {
      const count = ticket.ticketCount || 1;
      for (let i = 0; i < count; i++) {
        weightedTickets.push(ticket.teamName);
      }
    });
    
    if (weightedTickets.length === 0) return;
    
    // Enhanced 10x shuffle and select random winner from weighted array
    let shuffledWeightedTickets = shuffleArray(weightedTickets);
    for (let i = 0; i < 10; i++) {
      shuffledWeightedTickets = shuffleArray(shuffledWeightedTickets);
      console.log(`🔀 Manual selection shuffle pass ${i + 1}/10: First 5 tickets: [${shuffledWeightedTickets.slice(0, 5).join(', ')}]`);
    }
    let winnerName = shuffledWeightedTickets[Math.floor(rng() * shuffledWeightedTickets.length)];
    
    // Check if this winner was already a winner (previous winner drawn again)
    if (winners.includes(winnerName)) {
      // This is a previous winner being drawn again - mark as withdrawn/eliminated
      console.log(`${winnerName} was already a winner - marking as withdrawn`);
      setEliminated(prev => [...prev, winnerName]);
      // Note: No need to update tickets directly since we compute status from state arrays during render
      
      // Continue drawing until we get a new winner (not a previous winner)
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loop
      while (winners.includes(winnerName) && attempts < maxAttempts) {
        winnerName = shuffledWeightedTickets[Math.floor(rng() * shuffledWeightedTickets.length)];
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log('No new winners available - all eligible participants are previous winners');
        return;
      }
    }
    
    // Set the final winner (guaranteed to be a new winner)
    setSelectedWinner(winnerName);
    
    console.log(`🏆 MANUAL WINNER SELECTION 🏆`);
    console.log(`Previous winners:`, winners);
    console.log(`Selected winner: "${winnerName}"`);
    
    // Add new winner to winners list
    setWinners(prev => {
      const newWinners = [...prev, winnerName];
      console.log(`Updated winners array (manual):`, newWinners);
      return newWinners;
    });
    // Note: No need to update tickets directly since we compute isWinner from winners array during render
    
    // Call winner callback after delay
    setTimeout(() => {
      onWinner(winnerName);
      setTimeout(() => {
        onSpinComplete();
      }, 2000);
    }, 1000);
  }, [tickets, teams, rng, onWinner, onSpinComplete, shuffleArray, winners, withdrawn, withdrawnPlayers, eliminated]);

  /**
   * Handles winner withdrawal and automatic re-drawing
   * Called when a selected winner is not present and needs to be replaced
   * 
   * Process:
   * 1. Adds winner to withdrawn list (triggers red X overlay)
   * 2. Clears current selection state
   * 3. Automatically triggers new lottery animation after delay
   * 
   * @param winnerName - Name of the winner to withdraw
   */
  const handleWithdrawWinner = useCallback((winnerName: string) => {
    console.log(`🚫 MARKING WINNER AS WITHDRAWN 🚫`);
    console.log(`Withdrawn winner: "${winnerName}"`);
    console.log(`Current withdrawn array before update:`, withdrawn);
    console.log(`Current eliminated array before update:`, eliminated);
    console.log(`Current winners array:`, winners);
    
    // Add to withdrawn list
    setWithdrawn(prev => {
      const newWithdrawn = [...prev, winnerName];
      console.log(`✅ Updated withdrawn array:`, newWithdrawn);
      console.log(`🔴 Should now show RED X overlay for: "${winnerName}"`);
      console.log(`🔴 isWithdrawn check: ${newWithdrawn.includes(winnerName)}`);
      return newWithdrawn;
    });
    
    // Remove from current winner selection
    setSelectedWinner(null);
    setCurrentHighlight(null);
    
    console.log(`🔄 Will auto-redraw in 1 second...`);
    // Trigger a new drawing automatically
    setTimeout(() => {
      console.log(`🎰 Starting new lottery animation after withdrawal`);
      startLotteryAnimation();
    }, 1000); // 1 second delay to show the withdrawal
  }, [startLotteryAnimation, withdrawn, eliminated, winners]);

  // =============================================================================
  // LAYOUT AND STYLING CALCULATIONS
  // =============================================================================

  /**
   * Calculates optimal container style and cell size for responsive grid display
   * Memoized to prevent unnecessary recalculations during re-renders
   * 
   * @returns Object containing CSS grid styles and calculated cell size
   */
  const { containerStyle, cellSize } = useMemo(() => {
    if (gridSize.cols === 0 || gridSize.rows === 0) return { containerStyle: {}, cellSize: 0 };
    
    // Calculate available space
    const headerHeight = 60;
    const padding = 16;
    const gap = 4;
    const availableWidth = (typeof window !== 'undefined' ? window.innerWidth : 1920) - padding;
    const availableHeight = (typeof window !== 'undefined' ? window.innerHeight : 1080) - headerHeight - padding;
    
    // Calculate cell size to fit exactly within the grid
    const cellWidth = Math.floor((availableWidth - (gridSize.cols - 1) * gap) / gridSize.cols);
    const cellHeight = Math.floor((availableHeight - (gridSize.rows - 1) * gap) / gridSize.rows);
    const cellSize = Math.min(cellWidth, cellHeight);
    
    return {
      containerStyle: {
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize}px)`,
        gap: `${gap}px`,
        justifyContent: 'center',
        alignContent: 'center',
      },
      cellSize
    };
  }, [gridSize.cols, gridSize.rows]);

  // =============================================================================
  // LOADING STATE RENDERING
  // =============================================================================

  // Show loading screen while grid is being calculated
  if (tickets.length === 0 || gridSize.rows === 0 || gridSize.cols === 0) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-xl font-medium digital-font">Preparing Grid...</p>
          <p className="text-sm text-gray-400 mt-2">Setting up player positions</p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN COMPONENT RENDER
  // =============================================================================

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* =================================================================== */}
      {/* HEADER BAR - Status information and controls */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3 shadow-lg">
        <div className="flex items-center space-x-4 text-white">
          {/* Round and statistics display */}
          <span className="text-sm font-medium">Round 2</span>
          <span className="text-sm text-gray-300">|</span>
          <span className="text-sm text-gray-300">{tickets.length} Total Players</span>
          <span className="text-sm text-gray-300">|</span>
          <span className="text-sm text-gray-300">{teams.length} Eligible</span>
          <span className="text-sm text-gray-300">|</span>
          <span className="text-sm text-gray-300">
            {tickets.reduce((sum, ticket) => sum + (ticket.ticketCount || 1), 0)} Total Tickets
          </span>
          
          {/* Withdrawn players indicator */}
          {(() => {
            const autoWithdrawnCount = allTeams?.filter(t => t.status === 'withdrawn').length || 0;
            // Only count withdrawnPlayers (global) to avoid double counting with local withdrawn state
            const totalWithdrawn = withdrawnPlayers.length + autoWithdrawnCount;
            return totalWithdrawn > 0 && (
              <>
                <span className="text-sm text-gray-300">|</span>
                <span className="text-sm text-red-400">🚫 {totalWithdrawn} Withdrawn</span>
              </>
            );
          })()}
          
          {/* Current drawing number during animation */}
          {raffleState !== 'idle' && raffleState !== 'complete' && (
            <>
              <span className="text-sm text-gray-300">|</span>
              <span className="text-lg font-bold text-yellow-400 digital-font">
                Drawing: {currentSpinNumber}
              </span>
            </>
          )}
          
          {/* Winner announcement */}
          {selectedWinner && (
            <>
              <span className="text-sm text-gray-300">|</span>
              <span className="text-sm font-bold text-yellow-400">🎉 {selectedWinner} WINS!</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">


          {/* Animation status indicators */}
          {raffleState !== 'idle' && (
            <div className="text-white text-sm font-medium">
              {raffleState === 'spinning' && '🎲 Drawing...'}
              {raffleState === 'slowing' && '⏳ Almost there...'}
              {raffleState === 'complete' && '🎉 Winner Selected!'}
            </div>
          )}

          {/* Image loading indicator */}
          {isSpinning && !allImagesLoaded && tickets.length > 0 && (
            <div className="text-blue-400 text-sm font-medium digital-font">
              🖼️ Loading Images... ({imagesLoaded.size}/{allTeams?.length || 0})
            </div>
          )}

          {/* Ready state indicator */}
          {isSpinning && raffleState === 'idle' && tickets.length > 0 && allImagesLoaded && (
            <div className="text-yellow-400 text-sm font-medium digital-font">
              ⚡ Ready to Draw...
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Close Squid Game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN GRID CONTAINER - Participant display area */}
      {/* =================================================================== */}
      <div className="flex-1 p-1 overflow-hidden">
        <div style={containerStyle}>
          {tickets.map((ticket) => {
            // Calculate player status for rendering logic
            const isCurrentWinner = selectedWinner === ticket.teamName;
            const isAnyWinner = winners.includes(ticket.teamName) || isCurrentWinner;
            const isEliminated = eliminated.includes(ticket.teamName);
            const isWithdrawn = withdrawn.includes(ticket.teamName) || withdrawnPlayers.includes(ticket.teamName);
            const isAutoWithdrawn = ticket.ticketCount === 0; // Players with 0 tickets are auto-withdrawn
            const isHighlighted = currentHighlight === ticket.teamName;
            const eligibleTeamNames = teams.map(t => t.Team);
            const isEligible = eligibleTeamNames.includes(ticket.teamName) && !isAnyWinner && !isEliminated && !isWithdrawn && !isAutoWithdrawn;

            // Debug logging for complex status combinations (reduced noise)
            if (isAnyWinner || isEliminated || isWithdrawn || isAutoWithdrawn) {
              console.log(`🎨 ${ticket.teamName}: Winner=${isAnyWinner}, Eliminated=${isEliminated}, Withdrawn=${isWithdrawn}, AutoWithdrawn=${isAutoWithdrawn}, RedX=${isEliminated || isWithdrawn || isAutoWithdrawn}, CellSize=${cellSize}`);
            }

            return (
              <div
                key={ticket.id}
                className={`
                  relative border flex items-center justify-center overflow-hidden transition-all duration-300
                  ${(isEliminated || isWithdrawn || isAutoWithdrawn)
                    ? 'bg-gray-900 border-red-600' // Eliminated/withdrawn/auto-withdrawn players (red theme)
                    : isAnyWinner 
                    ? 'bg-orange-500 border-orange-400 shadow-2xl z-10' // Previous winners (orange)
                    : isHighlighted && isEligible
                    ? 'bg-green-500 border-green-400 shadow-xl z-20' // Currently highlighted
                    : isEligible
                    ? 'bg-gray-700 border-gray-600' // Eligible players
                    : 'bg-gray-800 border-gray-500 opacity-70' // Ineligible players
                  }
                  ${isCurrentWinner ? 'ring-4 ring-green-400' : ''} // Green ring for current winner
                `}
                style={{ 
                  gridColumn: ticket.position.col + 1,
                  gridRow: ticket.position.row + 1,
                  width: `${cellSize}px`, 
                  height: `${cellSize}px` 
                }}
              >
                {/* ========================================================= */}
                {/* PLAYER PHOTO BASE LAYER */}
                {/* ========================================================= */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <SquidGameUserPhoto 
                    name={ticket.teamName} 
                    size={cellSize}
                    className={`w-full h-full ${
                      isEliminated || isWithdrawn || isAutoWithdrawn 
                        ? 'grayscale opacity-30' // Faded for eliminated/withdrawn/auto-withdrawn
                        : !isEligible && !isAnyWinner && !isEliminated && !isWithdrawn && !isAutoWithdrawn 
                        ? 'opacity-80' // Slightly faded for ineligible
                        : '' // Normal for eligible/winners
                    }`}
                  />
                </div>

                {/* ========================================================= */}
                {/* WINNER OVERLAY - Green for current, Orange for previous */}
                {/* ========================================================= */}
                {isAnyWinner && !isEliminated && !isWithdrawn && !isAutoWithdrawn && (
                  <div 
                    className={`absolute flex items-center justify-center z-50 pointer-events-none shadow-lg ${
                      isCurrentWinner 
                        ? 'bg-green-500 bg-opacity-90 border-green-300' // Current winner: GREEN
                        : 'bg-orange-500 bg-opacity-90 border-orange-300' // Previous winners: ORANGE
                    }`}
                    style={{
                      top: '2px',
                      left: '2px',
                      right: '2px', 
                      bottom: '2px',
                      border: '2px solid',
                      backgroundColor: isCurrentWinner 
                        ? 'rgba(34, 197, 94, 0.9)' // Green for current winner
                        : 'rgba(249, 115, 22, 0.9)', // Orange for previous winners
                      borderColor: isCurrentWinner 
                        ? 'rgb(74, 222, 128)' // Green border for current winner
                        : 'rgb(253, 186, 116)', // Orange border for previous winners
                    }}
                  >
                    <span 
                      className={`digital-font text-white font-bold ${isCurrentWinner ? 'animate-bounce' : ''}`}
                      style={{ 
                        fontSize: `${cellSize * 0.3}px`, 
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        color: 'white'
                      }}
                    >
                      🏆
                    </span>
                  </div>
                )}

                {/* ========================================================= */}
                {/* ELIMINATION/WITHDRAWAL OVERLAY - Red X (highest priority) */}
                {/* ========================================================= */}
                {(isEliminated || isWithdrawn || isAutoWithdrawn) && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.9)', // Match transparency of green/orange overlays
                      border: '4px solid rgb(185, 28, 28)', // Darker red border to match pattern
                      zIndex: 9999, // Highest z-index to override winner overlays
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    }}
                  >
                    {/* CSS-based X icon using rotated divs */}
                    <div style={{
                      position: 'relative',
                      width: `${Math.max(30, cellSize * 0.4)}px`,
                      height: `${Math.max(30, cellSize * 0.4)}px`
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: `${Math.max(30, cellSize * 0.4)}px`,
                        height: `${Math.max(4, cellSize * 0.05)}px`,
                        backgroundColor: 'white',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        boxShadow: '0 0 6px rgba(0,0,0,0.8)'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: `${Math.max(30, cellSize * 0.4)}px`,
                        height: `${Math.max(4, cellSize * 0.05)}px`,
                        backgroundColor: 'white',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        boxShadow: '0 0 6px rgba(0,0,0,0.8)'
                      }} />
                    </div>
                  </div>
                )}
                
                {/* ========================================================= */}
                {/* SELECTION HIGHLIGHT OVERLAY - Green pulsing animation */}
                {/* ========================================================= */}
                {isHighlighted && isEligible && !isAnyWinner && !isEliminated && !isWithdrawn && !isAutoWithdrawn && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none shadow-lg"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.9)',
                      border: '4px solid rgb(74, 222, 128)',
                      zIndex: 9998, // High z-index but below elimination overlay
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    <span 
                      className="digital-font text-white font-bold"
                      style={{ 
                        fontSize: `${cellSize * 0.3}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        color: 'white'
                      }}
                    >
                      🎯
                    </span>
                  </div>
                )}
                
                {/* ========================================================= */}
                {/* PLAYER INFO OVERLAY - Number and ticket count */}
                {/* ========================================================= */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-95 text-white font-bold text-center digital-font z-40"
                  style={{
                    fontSize: `${Math.max(10, cellSize * 0.16)}px`,
                    padding: `${Math.max(2, cellSize * 0.03)}px`,
                    lineHeight: '1.1'
                  }}
                >
                  <div>{ticket.playerNumber}</div>
                  {ticket.ticketCount && ticket.ticketCount >= 1 && (
                    <div 
                      className="digital-font"
                      style={{ 
                        fontSize: `${Math.max(8, cellSize * 0.12)}px`,
                        color: '#fbbf24' // Yellow color for ticket count
                      }}
                    >
                      {ticket.ticketCount}x
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SquidGameAnimation;
