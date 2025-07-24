# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linter

### Testing & Validation
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:simulation` - Run simulation-specific tests
- `npm run test:advanced` - Run advanced edge case tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run validate` - Quick system validation using TypeScript
- `npm run validate-js` - JavaScript validation (fallback)

### Raffle Simulation & Analysis
- `npm run simulate:quick` - Fast simulation (20-50 teams, 100 runs, ~10s)
- `npm run simulate:standard` - Standard analysis (50-200 teams, 500 runs, ~30s)
- `npm run simulate:comprehensive` - Full analysis (100-1000 teams, 1000 runs, ~5min)
- `npm run simulate:performance` - Performance testing (1000-2000 teams, 100 runs, ~2min)

### Image Optimization
- `npm run optimize:images` - Optimize user photos
- `npm run optimize:images:small` - Optimize to 150x150px
- `npm run optimize:images:jpeg` - Convert to JPEG with 85% quality
- `npm run optimize:batch` - Batch optimize all images
- `npm run optimize:thumbnail` - Create thumbnails
- `npm run optimize:hq` - High-quality optimization
- `npm run optimize:squid` - Optimize for Squid Game theme

### ZIP File Processing
- `npm run process:zips` - Process all zip files in data/ folder and create thumbnails
- `npm run process:zips:watch` - Watch for new zip files and process automatically

## Application Architecture

### Core State Management
The application uses a centralized state management pattern via `useRaffleState` hook:
- **TeamData**: Loaded from CSV with rankings and status tracking
- **RaffleRounds**: Configurable elimination rounds with point thresholds
- **Winners**: Track winners across rounds with confirmation flow
- **RaffleState**: Global state including current round, drawing status, and remaining teams

### Key Data Flow
1. **CSV Upload** → Parse teams → Load into state with rankings
2. **Configuration** → Set raffle model and rounds → Generate optimal thresholds
3. **Raffle Execution** → Progressive elimination → Winner selection → Confirmation
4. **Visual Feedback** → Animated wheels/Squid Game → Results display

### Component Architecture
- **Main Page** (`src/app/page.tsx`) - Orchestrates entire raffle flow
- **Data Layer** (`src/hooks/useRaffleState.ts`) - State management and business logic
- **UI Components** (`src/app/components/`) - Modular raffle interface components
- **Utility Services** (`src/utils/`, `src/services/`) - Configuration, calculations, and models

### Raffle Models
Multiple elimination strategies supported via `src/services/raffleModels.ts`:
- **UNIFORM_ELIMINATION**: Even distribution across rounds
- **BELL_CURVE_ELIMINATION**: Normal distribution-based thresholds
- **PROGRESSIVE_ELIMINATION**: Increasing difficulty per round
- **EXPONENTIAL_ELIMINATION**: Exponential point requirements

### Animation Systems
Two visual selection methods:
- **Prize Wheel** (`PrizeWheel.tsx`) - Traditional spinning wheel with physics
- **Squid Game** (`SquidGameAnimation.tsx`) - Themed elimination animation

## File Structure & Key Locations

### Core Application
- `src/app/page.tsx` - Main raffle interface and orchestration
- `src/hooks/useRaffleState.ts` - Central state management
- `src/types/raffle.ts` - Core TypeScript interfaces
- `src/utils/configurationManager.ts` - Configuration persistence and management

### Components
- `src/app/components/CSVUploader.tsx` - File upload and parsing
- `src/app/components/DataTable.tsx` - Team data display with odds
- `src/app/components/PrizeWheel.tsx` - Animated winner selection
- `src/app/components/RaffleProgress.tsx` - Round progress visualization
- `src/app/components/WinnersDisplay.tsx` - Results presentation

### Business Logic
- `src/services/raffleEngine.ts` - Core raffle execution logic
- `src/services/raffleModels.ts` - Different elimination strategies
- `src/utils/oddsCalculation.ts` - Ticket calculation and odds

### Testing & Simulation
- `scripts/comprehensiveSimulation.ts` - Multi-scenario fairness analysis
- `scripts/validateRaffleSystem.ts` - System integrity validation
- `__tests__/` - Jest test suites for components and logic

## CSV Data Format

Required columns for team data:
- `Team` (string) - Unique team identifier
- `Points` (number) - Total points earned
- `Submissions` (number) - Number of submissions made
- `Last Submission` (string) - Date of last submission

Teams are automatically ranked by points (highest = #1) and assigned player numbers.

## User Photos

Avatar system expects photos at: `public/{teamName}/believeinyourselfie.png`
- Optimized versions automatically generated
- Fallback to default avatar if image missing
- Supports batch optimization via npm scripts

## Configuration System

Persistent configuration management via `ConfigurationManager`:
- Save/load multiple raffle configurations
- Includes team data, rounds, and settings
- Stored in localStorage with unique IDs
- Shareable via URL parameters (`?configId=...`)

## Testing Strategy

### Unit Tests
Focus on core business logic, state management, and utility functions.

### Simulation Tests
Statistical validation of fairness across multiple runs and team distributions.

### Performance Tests
Validate scalability with large team counts (1000+ teams).

### Validation Scripts
Quick integrity checks before live events.

## Key Patterns

### State Updates
Always use the `useRaffleState` actions for state changes. Direct state mutation is not supported.

### Winner Flow
Winner selection uses a confirmation pattern:
1. `selectWinner()` - Sets pending winner
2. `confirmWinner()` - Finalizes selection and advances round
3. `rejectWinner()` - Withdraws selection and allows redraw

### Round Progression
Rounds use point thresholds for elimination:
- Teams below threshold are filtered out
- Remaining teams advance to next round
- Final round uses weighted ticket system

### Error Handling
Comprehensive error handling in CSV parsing, configuration loading, and state management.

### Configuration Management
Multi-configuration support with persistent storage:
1. **Save Configurations** - Configurations are automatically saved to localStorage
2. **Load Configurations** - Restore saved configurations with team data and settings
3. **Switch Configurations** - Change active configuration with raffle state warnings
4. **Reset Raffle** - Clear raffle progress while preserving team data

### Active Raffle Detection
Raffle state is considered "active" when:
- `raffleStarted` is true, OR
- `winners.length > 0`, OR
- `currentRound > 0`

### Configuration Switching Flow
1. User clicks on different configuration
2. System checks if current raffle is active
3. If active, show confirmation modal warning about progress loss
4. If confirmed, reset current raffle and switch to new configuration
5. Load new configuration data and update localStorage

## Configuration Screen Workflows

### Reset Current Raffle
1. **Access**: Available from configurations page header when active raffle exists
2. **Detection**: Shows when `raffleStarted || winners.length > 0 || currentRound > 0`
3. **Confirmation**: Shows modal warning about clearing progress
4. **Action**: Calls `actions.resetRaffle()` to clear raffle state
5. **Preservation**: Keeps team data and configuration settings intact

### Switch Configuration with Active Raffle
1. **Trigger**: User clicks on different configuration when raffle is active
2. **Warning**: Modal shows current raffle progress will be lost
3. **Confirmation**: User must explicitly confirm the switch
4. **Process**: Reset current raffle, then load new configuration
5. **Update**: Set new configuration as active in localStorage

### Configuration Visual Indicators
- **Active Raffle Badge**: Orange badge showing "Active Raffle" on current configuration
- **Progress Status**: Shows current round, winners count, and total participants
- **Reset Button**: Orange "Reset Raffle" button in header and active status card
- **Animated Indicators**: Pulsing dots for active raffle status

### Multi-Configuration Support
- **Persistent Storage**: All configurations saved in localStorage
- **Configuration List**: Shows all saved configurations with metadata
- **Active Configuration**: Tracked via `currentConfigId` in localStorage
- **Configuration Switching**: Seamless switching with proper state management

## Performance Considerations

### Large Datasets
- Prize wheel performance degrades with >50 teams
- Consider pagination for >1000 teams in DataTable
- Simulation performance scales linearly with team count

### Memory Management
- State is kept minimal and efficient
- Images are optimized and cached
- Large simulations may hit memory limits

## Component Documentation

### Core UI Components

#### CSVUploader (`src/app/components/CSVUploader.tsx`)
**Purpose**: Handles CSV file upload and initial configuration setup
**Key Features**:
- PapaParse integration for CSV parsing with field validation
- Configuration name input with auto-generated default names
- Round count configuration (2-20 rounds recommended)
- Data validation ensuring correct column types (Team, Points, Submissions, Last Submission)
- Error handling for malformed CSV files
**Props**: `onDataLoaded`, `isDisabled`
**Usage**: Primary entry point for loading team data into the raffle system

#### DataTable (`src/app/components/DataTable.tsx`)
**Purpose**: Display team data in tabular format with real-time odds calculation
**Key Features**:
- Sortable display by player number (preserves point-based ranking)
- UserPhoto integration for visual identification
- Real-time odds calculation and display for current round
- Status indicators (eligible, winner, withdrawn, removed)
- Ticket count display based on points (Points ÷ 100)
- Extensive debug logging for troubleshooting
**Props**: `teams`, `title`, `showOdds`, `oddsPerRound`, `currentRound`
**Usage**: Used throughout app to display team data in different contexts

#### PrizeWheel (`src/app/components/PrizeWheel.tsx`)
**Purpose**: Animated spinning wheel for winner selection
**Key Features**:
- Weighted random selection based on ticket counts
- Visual wheel with color-coded segments for each team
- UserPhoto integration in wheel segments
- Smooth rotation animation with physics-based easing
- Winner announcement with celebration animation
- Automatic spin completion handling
**Props**: `teams`, `isSpinning`, `onWinner`, `onSpinComplete`
**Usage**: Alternative animation method to SquidGameAnimation

#### SquidGameAnimation (`src/app/components/SquidGameAnimation.tsx`)
**Purpose**: Grid-based elimination animation inspired by Squid Game
**Key Features**:
- Comprehensive grid layout with responsive sizing
- Weighted random selection using seedrandom for fairness
- Visual state tracking (eligible, winner, withdrawn, eliminated)
- Color-coded overlays for different player states
- Animation cycling during selection process
- Fisher-Yates shuffle algorithm for unbiased selection
- Extensive state management for complex animation flows
**Props**: `teams`, `allTeams`, `isSpinning`, `previousWinners`, `withdrawnPlayers`, `onWinner`, `onSpinComplete`, `onClose`
**Usage**: Primary animation method with rich visual feedback

#### RaffleProgress (`src/app/components/RaffleProgress.tsx`)
**Purpose**: Visual progress indicator for raffle rounds
**Key Features**:
- Animated progress bar with completion status
- Round indicators with check marks for completed rounds
- Current round highlighting with blue accent
- Dynamic team count display
- Raffle model information display
- Responsive design for different screen sizes
**Props**: `rounds`, `currentRound`, `remainingTeams`, `totalTeams`, `raffleModel`
**Usage**: Provides users with clear progress context during raffle

#### WinnersDisplay (`src/app/components/WinnersDisplay.tsx`)
**Purpose**: Showcase completed raffle winners
**Key Features**:
- Grid layout with animated winner cards
- UserPhoto integration for winner identification
- Prize numbering and round information
- Ticket count display from original team data
- Gradient backgrounds and celebratory styling
- AnimatePresence for smooth winner additions
**Props**: `winners`, `teams`
**Usage**: Final results display after raffle completion

#### WinnerConfirmation (`src/app/components/WinnerConfirmation.tsx`)
**Purpose**: Modal confirmation dialog for selected winners
**Key Features**:
- Full-screen modal with backdrop overlay
- Confetti animation using canvas-confetti library
- Celebration sound effects (public/tada.mp3)
- Large winner photo and name display
- Confirm/reject action buttons
- Auto-cleanup of confetti animations
**Props**: `winner`, `roundName`, `onConfirm`, `onReject`
**Usage**: Critical confirmation step preventing accidental winner selection

### Configuration Components

#### RaffleModelConfiguration (`src/app/components/RaffleModelConfiguration.tsx`)
**Purpose**: Radio button interface for selecting raffle elimination models
**Key Features**:
- Expandable configuration panel
- Model descriptions with property indicators
- Disabled state during active raffle
- Visual model comparison (elimination vs continuous, weighted vs equal)
**Props**: `currentModel`, `onModelChange`, `disabled`
**Usage**: Allows users to switch between different raffle strategies

#### UserPhoto (`src/app/components/UserPhoto.tsx`)
**Purpose**: Consistent user avatar display with fallback handling
**Key Features**:
- Multiple size options (sm, md, lg, xl, 2xl, 3xl, 4xl)
- Automatic fallback to generated avatars
- Loading states with skeleton animation
- Error handling for missing images
- Integration with photoUtils for path resolution
**Props**: `name`, `size`, `className`
**Usage**: Used throughout app for consistent user identification

### Utility Functions

#### photoUtils (`src/utils/photoUtils.ts`)
**Purpose**: Handle user photo paths and generate fallback avatars
**Key Features**:
- getUserPhotoPath: Maps names to photo file paths
- getFallbackAvatar: Generates 6 different cute avatar types (cat, robot, flower, star, geometric, bear)
- getSquidGamePhotoPath: Ultra-optimized 50x50 thumbnails for performance
- Deterministic avatar generation based on name hash
- SVG-based avatars with initials and colors
**Usage**: Centralized photo management for consistent display

#### oddsCalculation (`src/utils/oddsCalculation.ts`)
**Purpose**: Calculate raffle odds and ticket distributions
**Key Features**:
- calculateOdds: Complete odds calculation for participant arrays
- calculateTickets: Points-to-tickets conversion (Points ÷ 100)
- calculateSingleOdds: Individual participant odds calculation
- calculateTotalTickets: Sum tickets across all participants
- formatOddsAsPercentage: Consistent percentage formatting
- Round ID vs array index mapping documentation
**Usage**: Core business logic for fair raffle calculations

#### configurationManager (`src/utils/configurationManager.ts`)
**Purpose**: Persistent configuration storage and management
**Key Features**:
- Local storage persistence for raffle configurations
- Configuration CRUD operations
- Backward compatibility handling
- Optimal round generation for different raffle models
- Auto-generated configuration IDs
- Round threshold calculation based on team distribution
**Usage**: Enables save/load functionality for raffle setups

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Tailwind CSS for styling
- Framer Motion for animations
- ESLint configuration enforced

### Component Patterns
- All components use TypeScript interfaces for props
- Framer Motion for consistent animations
- Error boundaries and loading states
- Debug logging for troubleshooting
- Responsive design with dark mode support

### State Management
- Centralized state via useRaffleState hook
- Immutable state updates using setState callbacks
- Computed values with useMemo for performance
- Effect hooks for external state synchronization

### Testing Before Live Events
1. Run `npm run validate` for system check
2. Run `npm run simulate:standard` for fairness validation
3. Test with actual participant data if available
4. Verify all npm scripts work correctly

### Debugging
- Enable debug logging with `DEBUG=true` environment variable
- Check browser console for detailed state logging
- Use React DevTools for component inspection
- Each component has extensive console.log statements for troubleshooting