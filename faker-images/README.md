# Faker.js Image Generator & Test Data Creator

This project uses Faker.js to generate fake portrait images and comprehensive test datasets for application development and testing.

## Features

- **Portrait Generation**: Downloads 100 male and 100 female AI-generated portrait images (256x256 pixels)
- **DiceBear Avatars**: Downloads customizable SVG avatars in multiple styles (thumbs, avataaars, personas, etc.)
- **Test Data Generation**: Creates realistic datasets with user folders and assigned images
- **Gender Detection**: Automatically determines gender from names and assigns appropriate portraits
- **Point Calculation Logic**: Implements realistic submission-based point deduction system
- **Multiple Output Formats**: Generates CSV, JSON, and organized file structures
- **Repeatable Process**: Easy-to-run scripts for consistent test data generation

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download portrait images:**
   ```bash
   npm run download
   ```

3. **Generate test data:**
   ```bash
   npm run test-data:medium
   ```

## Available Commands

## Generated Data

For each portrait, the script generates:
- Portrait image URL (256x256 pixels)
- Full name
- Email address
- Age (18-65)
- Bio
- Job title and company
- Address information
- Phone number
- Website URL

## Test Data Generation Features

The test data generator creates realistic datasets for app testing with the following features:

### Data Structure
- **CSV Output**: Matches your sample.csv format with headers: `Team,Points,Submissions,Last Submission`
- **Timestamped Folders**: Each run creates a new folder with ISO timestamp
- **User Folders**: Individual folders for each user containing their portrait image
- **Gender Detection**: Automatically determines gender from names and assigns appropriate images
- **Unique Images**: Each image is used only once across all generated users

### Point System Logic
- **Random Points**: Generated in hundreds from 0 to 10,000 (configurable)
- **Calculated Submissions**: Based on points divided by random deductions (100-400 per submission)
- **Realistic Distribution**: Ensures logical relationship between points and submission count

### Example Calculation:
```
Random Points: 700
Submission 1: 700 - 300 = 400 remaining
Submission 2: 400 - 100 = 300 remaining  
Submission 3: 300 - 200 = 100 remaining
Submission 4: 100 - 100 = 0 remaining
Total Submissions: 4
```

## Output Structure

### URL Generation (npm start)
```
generated-images/
├── male/
│   ├── male_portrait_urls.txt
│   ├── male_users_data.json
│   └── male_users_data.csv
├── female/
│   ├── female_portrait_urls.txt
│   ├── female_users_data.json
│   └── female_users_data.csv
└── summary.json
```

### Image Download (npm run download)
```
downloaded-images/
├── male/
│   ├── male_portrait_001.jpg
│   ├── male_portrait_002.jpg
│   ├── ...
│   ├── male_portrait_100.jpg
│   ├── male_portraits_metadata.json
│   └── male_downloaded_files.txt
├── female/
│   ├── female_portrait_001.jpg
│   ├── female_portrait_002.jpg
│   ├── ...
│   ├── female_portrait_100.jpg
│   ├── female_portraits_metadata.json
│   └── female_downloaded_files.txt
└── download_summary.json
```

### Test Data Generation (npm run test-data:*)
```
test-data/
└── 2025-07-14_10-30-45/  # Timestamp folder
    ├── users.csv          # CSV matching sample.csv format
    ├── users_detailed.json # Complete user data
    ├── John_Smith/         # User folders named after users
    │   └── male_portrait_001.jpg
    ├── Jane_Doe/
    │   └── female_portrait_002.jpg
    └── ...
```

## Available Commands

### Image Downloads
```bash
# Generate URL lists only
npm start

# Download actual image files (required for test data generation)
npm run download

# Download DiceBear avatars
npm run download-dicebear                # Default: 50 thumbs style avatars
npm run dicebear:thumbs                  # 50 thumbs style avatars
npm run dicebear:avataaars              # 50 avataaars style avatars  
npm run dicebear:personas               # 50 personas style avatars
npm run dicebear:multi                  # Multiple styles (20 each)
npm run dicebear:list                   # List all available styles
```

### Test Data Generation
```bash
# Quick scenarios
npm run test-data:small    # 10 users
npm run test-data:medium   # 50 users  
npm run test-data:large    # 100 users
npm run test-data:custom   # 25 users with higher point ranges

# Direct script execution
node generate-test-data.js

# Interactive menu (Windows)
generate-menu.bat
```

### Testing & Verification
```bash
# Test point calculation logic
node test-calculations.js
```

## Customization

### Modifying Generation Parameters

Edit `generate-test-data.js` to customize:

```javascript
const CONFIG = {
    outputBaseDir: './test-data',
    imageSourceDir: './downloaded-images',
    numberOfUsers: 50,                    // Change user count
    pointsRange: { min: 0, max: 10000 },  // Adjust points range
    submissionPointsRange: { min: 100, max: 400 }  // Modify deduction range
};
```

### Creating Custom Scenarios

Add new scenarios to `run-scenario.js`:

```javascript
const TEST_SCENARIOS = {
    yourScenario: {
        numberOfUsers: 75,
        pointsRange: { min: 2000, max: 8000 },
        description: 'Your custom scenario'
    }
};
```

### Gender Detection

The script automatically detects gender from names using:
- Title indicators (Mr., Mrs., Dr., etc.)
- Faker.js name pattern matching
- Fallback random assignment

## Files Generated

Each test run creates a timestamped folder containing:
- `users.csv` - Main data file matching your sample format
- `users_detailed.json` - Complete user data with metadata
- Individual user folders with copied portrait images
- Each image is used only once across all generated users

## Requirements

- Node.js 14+ 
- Internet connection (for initial image download)
- ~50MB disk space for downloaded images

## License

MIT
