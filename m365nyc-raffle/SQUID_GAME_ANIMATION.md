# Squid Game Animation Feature

## Overview
The M365 Raffle App now includes a new "Squid Game" style winner selection animation that provides an immersive, grid-based ticket selection experience.

## Features

### 🎮 Grid-Based Animation
- Each participant gets squares based on their ticket count (100 points = 1 ticket)
- Tickets are thoroughly shuffled using high-quality randomization (seedrandom library)
- Grid fills the entire screen for maximum visual impact

### 🎨 Visual Design
- **Color-coded tiers** based on ticket count:
  - Purple: 50+ tickets (VIP)
  - Blue: 20+ tickets (Premium) 
  - Green: 10+ tickets (Good)
  - Yellow: 5+ tickets (Medium)
  - Gray: 1-4 tickets (Basic)

### ⚡ Animation Phases
1. **Spinning Phase**: Fast random highlighting (starts at 50ms intervals)
2. **Slowing Phase**: Gradually slows down over 4 seconds using cubic ease-out
3. **Constant Phase**: Slow selection for 2 seconds  
4. **Final Selection**: 3 final picks with 1.2s intervals
5. **Winner Announcement**: Confetti explosion and crown animation

### 📊 Real-time Feedback
- Progress bar showing completion percentage
- Live status updates ("Selecting Winner...", "Final Selection...", etc.)
- Ticket count display
- Color legend for tier understanding

### 🎭 Interactive Elements
- Highlighted squares with scale/rotation animations
- Glow effects and box shadows
- Winner crown animation with rotation and scaling
- Confetti burst on final selection

## How to Use

1. **Load your participant data** via CSV upload
2. **Choose animation type** using the new Animation Selector:
   - 🎡 Prize Wheel (classic spinning wheel)
   - 🟩 Squid Game Grid (new grid-based animation)
3. **Start the raffle** and watch the immersive selection process

## Technical Implementation

### High-Quality Randomization
- Uses `seedrandom` library for cryptographically secure random number generation
- Fisher-Yates shuffle algorithm for maximum randomness
- Multiple shuffle passes for enhanced unpredictability

### Performance Optimizations
- Dynamic grid sizing based on screen dimensions
- Efficient rendering with React key optimization
- Smooth animations using Framer Motion
- Responsive design for different screen sizes

### Accessibility
- High contrast color coding
- Clear visual feedback
- Progress indicators
- Screen reader friendly status updates

## Customization Options

The animation can be easily customized by modifying:
- **Color schemes** in the tier definitions
- **Animation timing** in the phase durations
- **Grid sizing** calculations
- **Confetti effects** parameters

## Browser Compatibility
- Works on all modern browsers
- Responsive design for desktop, tablet, and mobile
- Hardware acceleration for smooth animations

Enjoy the new immersive raffle experience! 🎉
