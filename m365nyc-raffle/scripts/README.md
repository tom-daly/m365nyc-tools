# Image Optimization Scripts

This directory contains scripts to optimize user photos for the M365 Raffle application, particularly for the Squid Game animation grid.

## 🚀 Quick Start for Squid Game Ultra-Optimization

**For the best Squid Game performance, use the ultra-compact optimizer:**

```cmd
npm install
npm run optimize:squid
```

This creates 50x50 AVIF images with 98%+ file size reduction (average 1KB per image).

## Quick Start

1. **Install dependencies:**
   ```cmd
   npm install
   ```

2. **Run optimization (recommended):**
   ```cmd
   npm run optimize:batch
   ```

## Available Scripts

### NPM Scripts (Recommended)

- `npm run optimize:squid` - **🎮 SQUID GAME SPECIAL** - Ultra-compact 50x50 AVIF (98%+ reduction)
- `npm run optimize:batch` - Default optimization (200x200 WebP, 90% quality)
- `npm run optimize:thumbnail` - Create thumbnails (100x100 WebP, 85% quality)  
- `npm run optimize:hq` - High quality (400x400 WebP, 95% quality)
- `npm run optimize:images` - Manual optimization with default settings
- `npm run optimize:images:small` - Manual optimization to 150x150
- `npm run optimize:images:jpeg` - Manual optimization to JPEG format

### Direct Script Usage

```cmd
# Basic usage
node scripts/optimizeImages.js

# Custom size and format
node scripts/optimizeImages.js --size 300x300 --format jpeg --quality 85

# Skip backup creation
node scripts/optimizeImages.js --no-backup

# Show help
node scripts/optimizeImages.js --help
```

## What the Scripts Do

### 🎯 Main Features

- **Automatic Discovery**: Finds all user directories in `/public/`
- **Smart Resizing**: Resizes images to optimal grid dimensions
- **Format Conversion**: Converts to WebP for best compression
- **Quality Optimization**: Balances file size and visual quality
- **Backup Creation**: Saves originals to `/public/originals-backup/`
- **Batch Processing**: Handles all users automatically

### 📊 Processing Details

- **Supported Formats**: JPG, PNG, GIF, BMP, TIFF, WebP
- **Default Output**: WebP format (best compression)
- **Backup Location**: `/public/originals-backup/`
- **Grid Optimization**: Perfect for Squid Game 200x200 cells
- **Compression**: Typically 60-80% file size reduction

### 🔧 Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--size WIDTHxHEIGHT` | Target dimensions | 200x200 |
| `--format FORMAT` | Output format (webp/jpeg/png) | webp |
| `--quality QUALITY` | Image quality 1-100 | 90 |
| `--no-backup` | Skip creating backups | false |

## Presets

### Squid Game (Default)
- **Size**: 200x200px
- **Format**: WebP
- **Quality**: 90%
- **Use Case**: Perfect for the game grid

### Thumbnail
- **Size**: 100x100px  
- **Format**: WebP
- **Quality**: 85%
- **Use Case**: Small previews, quick loading

### High Quality
- **Size**: 400x400px
- **Format**: WebP
- **Quality**: 95%
- **Use Case**: Detailed display, print ready

### Low Bandwidth
- **Size**: 150x150px
- **Format**: WebP
- **Quality**: 75%
- **Use Case**: Slow connections, mobile data

## Example Output

```
🖼️  M365 Raffle Image Optimizer
================================
Source directory: D:\\_git\\m365nyc-raffle\\m365-raffle\\public
Target size: 200x200
Output format: webp
Create backup: true

📂 Found 127 user directories

📁 Aaron Jones: Processing 1 image(s)
  🔄 Processing: Believe in Your Selfie 😗🤳.png
  📁 Backed up: Believe in Your Selfie 😗🤳.png
  📊 Original: 1024x768, 245.2 KB
  ✅ Optimized: 67.8 KB (72.4% reduction)

📊 OPTIMIZATION SUMMARY
========================
✅ Images processed: 127
⏩ Images skipped: 0
❌ Errors: 0
📦 Total size before: 31.2 MB
📦 Total size after: 8.6 MB
💾 Space saved: 22.6 MB (72.4% reduction)

🎉 Image optimization completed!
```

## File Structure

```
public/
├── Aaron Jones/
│   └── profile.webp              # Optimized image
├── Abigail Peterson/
│   └── headshot.webp            # Optimized image
├── originals-backup/            # Backup directory
│   ├── Aaron Jones/
│   │   └── Believe in Your Selfie 😗🤳.png
│   └── Abigail Peterson/
│       └── Professional Headshot.jpg
└── ...
```

## Dependencies

- **sharp**: High-performance image processing
- **fs.promises**: Modern file system operations
- **path**: File path utilities

## Error Handling

- **Missing directories**: Warns and continues
- **Unsupported formats**: Skips with warning
- **Processing errors**: Logs error and continues
- **Backup failures**: Warns but continues processing
- **Permission errors**: Detailed error messages

## Performance

- **Parallel Processing**: Processes multiple users efficiently
- **Memory Management**: Handles large image sets
- **Progress Tracking**: Real-time processing updates
- **Size Reporting**: Before/after comparisons
- **Speed**: Typically 1-3 seconds per image

## Best Practices

1. **Always run with backup** (default behavior)
2. **Use WebP format** for best compression
3. **Test with small batch** before full optimization
4. **Check results** in browser after optimization
5. **Keep originals** until satisfied with results

## Troubleshooting

### Common Issues

**"sharp not found"**
```cmd
npm install sharp
```

**"Permission denied"**
- Ensure files aren't open in other programs
- Run with administrator privileges if needed

**"Out of memory"**
- Process smaller batches
- Close other applications
- Restart and try again

### Getting Help

```cmd
node scripts/optimizeImages.js --help
node scripts/batchOptimize.js --help
```
