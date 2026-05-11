# 🎯 Super Fun Raffle System

A progressive raffle application built with Next.js, TypeScript, Tailwind CSS, and Framer Motion. The system supports multiple elimination rounds based on point thresholds with an animated prize wheel for the final drawings.

## ✨ Features

- **CSV Upload**: Upload team data with Team, Points, Submissions, and Last Submission columns
- **Progressive Elimination**: 5 rounds with increasing point thresholds (0, 250, 500, 750, 1000)
- **Weighted Ticket System**: Points ÷ 100 = number of raffle tickets in final round
- **Animated Prize Wheel**: Visual spinning wheel animation for winner selection
- **Winner Tracking**: Remove winners from future rounds automatically
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light theme support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd m365-raffle
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## 📊 CSV Format

Your CSV file must include these columns:

| Column | Type | Description |
|--------|------|-------------|
| Team | String | Team name (unique identifier) |
| Points | Number | Total points earned |
| Submissions | Number | Number of submissions made |
| Last Submission | String | Date of last submission |

### Sample CSV:
```csv
Team,Points,Submissions,Last Submission
Alpha Squad,1250,15,2024-01-15
Beta Team,950,12,2024-01-14
Gamma Force,1150,18,2024-01-16
```

A sample CSV file is provided at `public/sample-data.csv` for testing.

## 🎮 How to Use

1. **Upload CSV**: Click "Choose File" and select your team data CSV
2. **Review Data**: Verify the loaded team data in the table
3. **Start Raffle**: Click "🚀 Start Raffle" to begin
4. **Conduct Rounds**: Progress through each round:
   - **Round 1**: All teams (0+ points)
   - **Round 2**: Teams with 250+ points  
   - **Round 3**: Teams with 500+ points
   - **Round 4**: Teams with 750+ points
   - **Final Round**: Teams with 1000+ points
5. **Draw Winners**: Click "🎲 Draw Winner" for animated selection
6. **View Results**: Winners are displayed with their round and prize info

## 🎯 Raffle Rules

- **Point Thresholds**: Teams must meet minimum points to advance to each round
- **Weighted Tickets**: In the final round, teams get tickets based on points (Points ÷ 100)
- **One Prize Per Winner**: Winners are removed from subsequent rounds
- **Progressive Elimination**: Fewer teams advance as thresholds increase

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.5 with TypeScript
- **Styling**: Tailwind CSS 4.1.11
- **Animations**: Framer Motion 12.23.1
- **CSV Parsing**: PapaParse 5.5.3
- **State Management**: React Hooks (useState, useCallback, useMemo)

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── CSVUploader.tsx      # File upload and CSV parsing
│   │   ├── DataTable.tsx        # Team data display
│   │   ├── RaffleProgress.tsx   # Round progress indicator
│   │   ├── PrizeWheel.tsx       # Animated spinning wheel
│   │   └── WinnersDisplay.tsx   # Winners showcase
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # App layout
│   └── page.tsx                 # Main raffle page
├── hooks/
│   └── useRaffleState.ts        # State management hook
└── types/
    └── raffle.ts                # TypeScript interfaces
```

## 🎨 Customization

### Modify Round Configuration

Edit `src/hooks/useRaffleState.ts` to change point thresholds:

```typescript
const DEFAULT_ROUNDS: RaffleRound[] = [
  { id: 1, name: "Round 1", pointThreshold: 0, description: "..." },
  { id: 2, name: "Round 2", pointThreshold: 250, description: "..." },
  // Add/modify rounds as needed
];
```

### Adjust Ticket Calculation

Modify the ticket calculation in `src/app/components/PrizeWheel.tsx`:

```typescript
const ticketCount = Math.max(1, Math.floor(team.Points / 100)); // Change divisor
```

### Customize Colors

Edit Tailwind classes throughout components or modify the prize wheel colors in `PrizeWheel.tsx`:

```typescript
color: `hsl(${(index * 137.5) % 360}, 70%, 60%)` // Adjust HSL values
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Components**: Add to `src/app/components/`
2. **State Logic**: Extend `useRaffleState.ts` hook
3. **Types**: Update `src/types/raffle.ts`
4. **Styling**: Use Tailwind CSS classes

## 🐛 Troubleshooting

### CSV Upload Issues
- Ensure your CSV has the exact column names: `Team`, `Points`, `Submissions`, `Last Submission`
- Points and Submissions must be numeric values
- Check browser console for parsing errors

### Display Issues
- Clear browser cache if styles appear broken
- Ensure all dependencies are installed with `npm install`
- Check browser developer tools for console errors

### Performance
- For large datasets (>1000 teams), consider pagination in DataTable component
- Prize wheel performance may degrade with >50 teams in final round

## 📄 License

This project is built for the M365 NYC community event. Feel free to adapt for your own raffle needs!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ for M365 NYC community events
