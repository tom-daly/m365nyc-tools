# M365 NYC Conference Schedule Generator

Automatically generates printable HTML handouts from conference schedule JSON data.

## Features

✅ **Column Layout**: Rooms displayed horizontally across the page  
✅ **Time Slots**: Organized chronologically from top to bottom  
✅ **Complete Data**: All sessions, speakers, service events, and keynotes  
✅ **Print Optimized**: Responsive CSS for perfect printing  
✅ **Color Coded**: Service sessions (blue), keynotes (yellow), regular sessions (white)  
✅ **Repeatable**: Rerun anytime when schedule data changes  

## Quick Start

```bash
# Generate the handout
npm run generate

# Or run directly
node generate-handout.js
```

This creates `schedule-handout.html` - open in browser and print.

## Room Order

The handout displays rooms in this order (left to right):
1. 05 Broadway
2. 05 Marquis  
3. 05 Music Box
4. 05 New Amsterdam
5. 05 Winter Garden
6. 06 Ambassador
7. 06 Belasco
8. 06 Radio City

## File Structure

```
├── data/
│   └── schedule.json         # Source schedule data
├── generate-handout.js       # Generator script
├── schedule-handout.html     # Generated handout
└── column-layout-handout.html # Manual example
```

## How It Works

1. **Reads** `data/schedule.json`
2. **Parses** sessions by time slots and rooms  
3. **Generates** HTML with CSS grid layout
4. **Outputs** print-ready handout

## Customization

Edit `generate-handout.js` to modify:
- Room order (ROOM_ORDER array)
- Styling (CSS in generateHTMLHeader)
- Time format (formatTimeSlot function)
- Session categorization (service/keynote detection)

## Requirements

- Node.js (any recent version)
- Valid `data/schedule.json` file

## Generated Output

The script creates a responsive HTML handout with:
- **Time-based rows** showing what's happening when
- **Room-based columns** showing where sessions occur  
- **Visual indicators** for different session types
- **Print optimization** for standard paper sizes

Perfect for conference attendees to plan their schedule at a glance!