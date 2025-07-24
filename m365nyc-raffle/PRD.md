**Product Requirements Document (PRD)**

**Project:** M365 NYC Goosechase Progressive Raffle App
**Platform:** Web (Next.js + React + Tailwind CSS)
**Visual Theme:** Squid Game-inspired suspense, avatar-rich UI
**Raffle Strategy:** Option 6 – Progressive Cutoff Raffle (Bell-Curve Based)

---

### 1. Objective

Build an interactive and visual raffle app that progressively eliminates low-performing participants (based on Goosechase point scores) across multiple rounds. Rounds culminate in a high-stakes grand prize drawing with weighted odds based on score.

---

### 2. User Roles

* **Admin/Operator:** Uploads data, configures settings, triggers raffle rounds.
* **Attendee (passive role):** Shown on screen with name, points, and avatar.

---

### 3. Data Input

**Source:** CSV Upload via Configuration UI

**CSV Schema:**

| Team         | Points | Submissions | Last Submission          |
| ------------ | ------ | ----------- | ------------------------ |
| Tommy Salami | 400    | 1           | 2025-06-24T16:11:59.438Z |

**Parsing Logic:**

* Parse CSV using PapaParse.
* Normalize all fields (points as number, dates as ISO, etc.)

---

### 4. Configuration Screen

#### 4.1 Basic Configuration
* Upload CSV File
* Input: Number of raffle rounds (e.g., 5)
* Automatically calculate simple division-based distribution (Total players ÷ Number of rounds)
* Preview parsed participant list with avatars

#### 4.2 Multi-Configuration Management
* **Save/Load Configurations**: Persistent storage of multiple raffle configurations
* **Configuration Switching**: Switch between saved configurations with active raffle warnings
* **Active Raffle Indicators**: Visual indicators showing which configuration has an active raffle
* **Configuration List**: Display all saved configurations with metadata (creation date, team count, rounds)

#### 4.3 Raffle State Management
* **Reset Current Raffle**: Reset active raffle while preserving team data
* **Switch Configuration Warning**: Prompt when switching configurations would clear active raffle progress
* **Active Raffle Status**: Visual status showing current round, winners count, and total participants
* **Configuration Persistence**: Maintain raffle state across browser sessions

#### 4.4 User Experience Enhancements
* **Confirmation Modals**: Clear warnings for destructive actions (reset, switch configurations)
* **Visual Feedback**: Active raffle badges, progress indicators, and status animations
* **Keyboard Navigation**: Escape key support for modal dismissal
* **Responsive Design**: Optimized for desktop and mobile configuration management

---

### 5. Configuration Data Management

#### 5.1 Configuration Storage
* **LocalStorage Persistence**: All configurations stored in browser localStorage
* **Configuration Schema**: Structured data including teams, rounds, settings, and metadata
* **Backup Safety**: Error handling for localStorage corruption or quota exceeded
* **Configuration Versioning**: Track creation and modification dates

#### 5.2 Multi-Configuration Support
* **Configuration Switching**: Seamless switching between different raffle setups
* **Active Configuration Tracking**: Single active configuration with localStorage persistence
* **Configuration Validation**: Ensure data integrity when loading saved configurations
* **Bulk Operations**: Support for managing multiple configurations

#### 5.3 Raffle State Integration
* **State Preservation**: Maintain raffle progress when switching configurations
* **Reset Functionality**: Clear raffle state while preserving team data
* **Progress Tracking**: Track winners, rounds, and withdrawn players across sessions
* **Configuration Sync**: Sync raffle state with active configuration

---

### 6. Data Breakdown Logic

* Use simple division: Number of rounds ÷ Number of players = Players per round
* Each round eliminates approximately 1/Nth of remaining players
* After each round, eliminate lowest-performing group
* Advance remaining players to next round
* Final round uses point-based weighting: (Points ÷ 100 = ticket count)

---

### 6. Visual UI Requirements

* **Left Panel:** Grid of avatars (player's photo), name, and score
  * Avatar path: `<span>/public/{username}/believeinyourselfie.png</span>`
* **Right Panel:**
  * Large button to trigger raffle
  * Animated raffle name spinner (simulated scrolling/randomizer)
  * Display selected winner
  * 'Confirm' button to lock in winner and proceed

---

### 7. Raffle Flow

1. **Admin clicks 'Start Raffle'**
2. UI animates raffle picker until it lands on a name
3. Winner is shown with a modal
4. Admin clicks 'Confirm Winner'
5. Winner is removed from future rounds
6. Cut off bottom performers (based on current cutoff)
7. Click 'Next Round' to continue
8. Final round uses weighted draw based on point/ticket multiplier

---

### 8. Visual & UX Enhancements

* Framer Motion for spin/flash animation
* Sound effects for suspense
* Confetti or light flash for winner
* Floating label indicator: "X players eliminated"

---

### 9. Technical Stack

* Next.js (TypeScript)
* React + Tailwind CSS
* Framer Motion
* PapaParse (CSV parser)
* Optional: LocalStorage/Firebase for saving interim state

---

### 10. Constraints

* Must be fully client-side
* All images must be in `<span>/public/{username}/believeinyourselfie.png</span>`
* No external DB required

---

### 11. Deliverables

* Upload + Config screen
* Raffle UI with dynamic rounds
* Bell curve percentile logic engine
* Animated winner picker
* Result display + round advancement flow

---
