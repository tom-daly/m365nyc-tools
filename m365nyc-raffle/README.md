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

For a live event this CSV is generated from Goosechase — see below. You can also
hand-write one with the four columns above.

## 🦆 Refreshing from Goosechase

Team data and participant photos both come from a Goosechase experience export.
The whole loop is automated by the **`goosechase-refresh` skill** — in Claude Code, run:

```
/goosechase-refresh
```

It asks which year (defaults to the latest), drives Chrome to download the two
exports from Goosechase Studio, then rebuilds everything and reports coverage.

### What it needs

Two files, both from Goosechase Studio. Neither is sufficient alone — the zip has
no points, and the CSV has no photos.

| Input | Where | Provides |
|---|---|---|
| Submissions zip (~360MB) | Review → Submissions → **Download**, grouped **by Team** | Photos |
| Participants CSV | Review → Stats → **Participants** → Download CSV | Points, submissions |

> The Stats page has four "Download CSV" buttons. It must be the **Participants**
> one — *Submissions* gives one row per submission with no per-team totals.

### The pipeline

```
Goosechase export .zip
  → npm run refresh:ingest -- "<zip>" --participants "<csv>"
ingest/raw/<Team>/<Mission>.jpg                      source photos, local only
  → npm run optimize:images
public/users/<Team>/{avatar,lg,sm,thumbnail}.webp    deployed with the site
  → npm run build
public/photo-catalog.json                            which teams have photos

Participants.csv
  → npm run refresh:teams -- "<csv>"
ingest/teams.csv                                     upload this to the app
```

Avatars prefer each person's "Believe in Your Selfie" submission and fall back to
a generated dicebear thumb. Expect roughly half the field to have real photos.

### Manual commands

```bash
npm run refresh:wipe                 # report what would be cleared (dry run)
npm run refresh:wipe -- --confirm    # clear derived data
npm run refresh:ingest -- "<zip>" --participants "<csv>" --dry-run
npm run refresh:teams -- "<csv>"     # -> ingest/teams.csv
```

`ingest/raw` is the only copy of the source photos and is **never** cleared unless
you pass `--include-raw`. Dry-run the ingest and compare counts before doing that —
a smaller export will silently drop people who no longer appear in it.

Everything under `ingest/` is gitignored working data. It lives outside `public/`
deliberately, so the full-resolution originals can never be copied into the
deployed site.

## ☁️ Deployment

Hosted on Azure Static Web Apps as a fully static export — no server, no database.

```bash
npm run build
npm run deploy:quick    # build + upload
npm run deploy          # re-optimize photos, then build + upload
```

Requires the Azure CLI and a current `az login`. The deployment token is read from
Azure at run time and never written to disk.

Deploys run from a workstation rather than CI, because `public/users/` is generated
locally and is not committed — a CI deploy would replace every avatar with a
gradient. The GitHub Action lints, builds, and verifies only.

Deployed photos are publicly fetchable at the site URL. Keeping the source files
out of git protects the repository, not the live site.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for resource names and the safety guards.

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

Outside `src/`:

```
.claude/skills/goosechase-refresh/
├── SKILL.md                     # The /goosechase-refresh workflow
└── scripts/
    ├── ingestGoosechaseZip.js   # export zip -> ingest/raw
    ├── convertParticipants.js   # participants CSV -> ingest/teams.csv
    └── wipePhotoData.js         # clear derived data

scripts/                         # shared build/deploy tooling
├── optimizeImages.js            # ingest/raw -> public/users
├── generatePhotoCatalog.js      # prebuild: photo-catalog.json
├── pruneStaticExport.js         # postbuild: guard + SWA config
└── deployToAzure.js             # upload out/ to Azure

ingest/                          # gitignored working data
├── raw/<Team>/<Mission>.jpg     # source photos
└── teams.csv                    # generated raffle CSV
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
- `npm run build` - Build the static export to `out/`
- `npm run lint` - Run ESLint
- `npm run test` - Run the Jest suite
- `npm run deploy:quick` - Build and deploy to Azure
- `npm run refresh:ingest` - Ingest a Goosechase export zip
- `npm run refresh:teams` - Convert a Goosechase participants CSV
- `npm run refresh:wipe` - Clear derived photo data (dry run by default)
- `npm run optimize:images` - Rebuild avatars from `ingest/raw`

`npm run start` is not useful here — the app is a static export, so serve `out/`
with any static file server instead.

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
