#!/usr/bin/env node

/**
 * Image Optimization Script for M365 Raffle
 * 
 * This script resizes and optimizes images in the /public/ folder:
 * - Resizes images to optimal dimensions for the Squid Game grid
 * - Compresses images to reduce file size
 * - Maintains aspect ratio and quality
 * - Creates backup of original images
 * - Processes all user photo directories
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Configuration
const CONFIG = {
  // Source and destination directories
  sourceDir: path.join(process.cwd(), 'data', 'raw'),
  outputDir: path.join(process.cwd(), 'public', 'users'),
  backupDir: path.join(process.cwd(), 'public', 'originals-backup'),
  
  // Image optimization settings - multiple sizes
  sizes: {
    lg: { width: 300, height: 300 },  // Large size
    md: { width: 200, height: 200 },  // Medium size (avatar)
    sm: { width: 150, height: 150 },  // Small size
    thumbnail: { width: 50, height: 50 }  // Thumbnail size
  },
  
  // Quality settings
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  },
  
  png: {
    quality: 90,
    compressionLevel: 8,
    progressive: true
  },
  
  webp: {
    quality: 90,
    effort: 6
  },
  
  // File processing settings
  supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'],
  outputFormat: 'webp', // Convert all to WebP for best compression
  createBackup: true,
  
  // Processing options
  fit: 'cover', // 'cover', 'contain', 'fill', 'inside', 'outside'
  withoutEnlargement: true, // Don't upscale small images
};

class ImageOptimizer {
  constructor(config) {
    this.config = config;
    this.processedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.totalSizeBefore = 0;
    this.totalSizeAfter = 0;
  }

  async init() {
    console.log('🖼️  M365 Raffle Image Optimizer');
    console.log('================================');
    console.log(`Source directory: ${this.config.sourceDir}`);
    if (this.config.sizes) {
      console.log(`Sizes to generate:`);
      Object.entries(this.config.sizes).forEach(([key, size]) => {
        console.log(`  ${key}: ${size.width}x${size.height}`);
      });
    } else if (this.config.targetSize) {
      console.log(`Target size: ${this.config.targetSize.width}x${this.config.targetSize.height}`);
    }
    console.log(`Output format: ${this.config.outputFormat}`);
    console.log(`Create backup: ${this.config.createBackup}`);
    console.log('');

    // Create backup directory if needed
    if (this.config.createBackup) {
      try {
        await fs.mkdir(this.config.backupDir, { recursive: true });
        console.log(`✅ Backup directory created: ${this.config.backupDir}`);
      } catch (error) {
        console.log(`ℹ️  Backup directory already exists: ${this.config.backupDir}`);
      }
    }
  }

  async findUserDirectories() {
    const entries = await fs.readdir(this.config.sourceDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.'))
      .map(entry => entry.name);
  }

  async findImagesInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        const fileName = file.toLowerCase();
        return this.config.supportedFormats.includes(ext) && 
               fileName.includes('believe in your selfie');
      });
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${dirPath}: ${error.message}`);
      return [];
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async backupImage(sourcePath, userDir, fileName) {
    if (!this.config.createBackup) return;

    const backupUserDir = path.join(this.config.backupDir, userDir);
    await fs.mkdir(backupUserDir, { recursive: true });
    
    const backupPath = path.join(backupUserDir, fileName);
    try {
      await fs.copyFile(sourcePath, backupPath);
      console.log(`  📁 Backed up: ${fileName}`);
    } catch (error) {
      console.warn(`  ⚠️  Backup failed for ${fileName}: ${error.message}`);
    }
  }

  async optimizeImage(sourcePath, outputUserDir, userDir, fileName) {
    try {
      const originalSize = await this.getFileSize(sourcePath);
      this.totalSizeBefore += originalSize;

      // Create backup before processing
      await this.backupImage(sourcePath, userDir, fileName);

      // Get image info
      const image = sharp(sourcePath);
      const metadata = await image.metadata();
      
      console.log(`  📊 Original: ${metadata.width}x${metadata.height}, ${this.formatFileSize(originalSize)}`);

      // Create images for all configured sizes
      const createdFiles = [];
      let totalOptimizedSize = 0;
      
      for (const [sizeName, sizeConfig] of Object.entries(this.config.sizes)) {
        const fileName = sizeName === 'md' ? 'avatar.webp' : `${sizeName}.webp`;
        const imagePath = path.join(outputUserDir, fileName);
        
        let sizedImage = image.clone().resize({
          width: sizeConfig.width,
          height: sizeConfig.height,
          fit: this.config.fit,
          withoutEnlargement: this.config.withoutEnlargement
        }).webp(this.config.webp);

        await sizedImage.toFile(imagePath);
        const fileSize = await this.getFileSize(imagePath);
        this.totalSizeAfter += fileSize;
        totalOptimizedSize += fileSize;
        
        createdFiles.push({
          name: sizeName,
          fileName,
          size: fileSize
        });
      }
      
      const compressionRatio = ((originalSize - totalOptimizedSize) / originalSize * 100).toFixed(1);
      
      console.log(`  ✅ Created ${createdFiles.length} sizes:`);
      createdFiles.forEach(file => {
        console.log(`    ${file.name}: ${this.formatFileSize(file.size)}`);
      });
      console.log(`  💾 Combined reduction: ${compressionRatio}%`);
      
      this.processedCount += createdFiles.length;
      
    } catch (error) {
      console.error(`  ❌ Error processing ${fileName}: ${error.message}`);
      this.errorCount++;
    }
  }

  sanitizeUserDir(userDir) {
    return userDir.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
  }

  async createThumbsFallback(userDir, outputUserDir) {
    console.log(`  🎲 Using random thumb for ${userDir}`);
    
    try {
      // Get random SVG from thumbs directory
      const thumbsDir = path.join(process.cwd(), 'public', 'thumbs');
      const thumbFiles = await fs.readdir(thumbsDir);
      const svgFiles = thumbFiles.filter(file => file.endsWith('.svg'));
      
      if (svgFiles.length === 0) {
        throw new Error('No SVG files found in public/thumbs directory');
      }
      
      // Select random SVG based on user directory name (deterministic but appears random)
      const randomIndex = userDir.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % svgFiles.length;
      const selectedSvg = svgFiles[randomIndex];
      const svgPath = path.join(thumbsDir, selectedSvg);
      
      // Read and process the SVG
      const svgContent = await fs.readFile(svgPath);
      
      // Create optimized images for all sizes using the random SVG
      const createdFiles = [];
      
      for (const [sizeName, sizeConfig] of Object.entries(this.config.sizes)) {
        const fileName = sizeName === 'md' ? 'avatar.webp' : `${sizeName}.webp`;
        const imagePath = path.join(outputUserDir, fileName);
        
        await sharp(svgContent)
          .resize({
            width: sizeConfig.width,
            height: sizeConfig.height,
            fit: this.config.fit,
            withoutEnlargement: this.config.withoutEnlargement
          })
          .webp(this.config.webp)
          .toFile(imagePath);
          
        const fileSize = await this.getFileSize(imagePath);
        this.totalSizeAfter += fileSize;
        
        createdFiles.push({ name: sizeName, fileName, size: fileSize });
      }
      
      console.log(`  ✅ Created ${createdFiles.length} sizes from thumb: ${selectedSvg}`);
      createdFiles.forEach(file => {
        console.log(`    ${file.name}: ${this.formatFileSize(file.size)}`);
      });
      this.processedCount += createdFiles.length;
      
    } catch (error) {
      console.error(`  ❌ Error creating thumb fallback for ${userDir}: ${error.message}`);
      this.errorCount++;
    }
  }



  async processUserDirectory(userDir) {
    const userDirPath = path.join(this.config.sourceDir, userDir);
    const sanitizedUserDir = this.sanitizeUserDir(userDir);
    const outputUserDir = path.join(this.config.outputDir, sanitizedUserDir);
    
    // Check if source directory exists and has images
    let images = [];
    try {
      images = await this.findImagesInDirectory(userDirPath);
    } catch (error) {
      console.log(`📁 ${userDir} → ${sanitizedUserDir}: Source directory not found, using random thumb`);
      // Create output user directory with sanitized name
      await fs.mkdir(outputUserDir, { recursive: true });
      await this.createThumbsFallback(userDir, outputUserDir);
      console.log('');
      return;
    }
    
    if (images.length === 0) {
      console.log(`📁 ${userDir} → ${sanitizedUserDir}: No "Believe in Your Selfie" images found, using random thumb`);
      // Create output user directory with sanitized name
      await fs.mkdir(outputUserDir, { recursive: true });
      await this.createThumbsFallback(userDir, outputUserDir);
      console.log('');
      return;
    }

    // Create output user directory with sanitized name
    await fs.mkdir(outputUserDir, { recursive: true });

    console.log(`📁 ${userDir} → ${sanitizedUserDir}: Processing ${images.length} image(s)`);
    
    for (const image of images) {
      const sourcePath = path.join(userDirPath, image);
      
      console.log(`  🔄 Processing: ${image}`);
      await this.optimizeImage(sourcePath, outputUserDir, userDir, image);
    }
    
    console.log('');
  }

  async getTeamsFromCSV() {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'M365 NYC Goosechase\'s leaderboard (3).csv');
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      
      // Skip header, get team names
      const teams = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          // Parse CSV line (handle quoted values with commas)
          const matches = line.match(/(?:^|,)("(?:[^"]+|"")*"|[^,]*)/g);
          if (matches && matches.length > 0) {
            let teamName = matches[0].replace(/^,/, '').replace(/^"/, '').replace(/"$/, '');
            return teamName.trim();
          }
          return null;
        })
        .filter(team => team);
        
      console.log(`📊 Found ${teams.length} teams in CSV`);
      return teams;
    } catch (error) {
      console.warn(`⚠️  Could not read CSV file: ${error.message}`);
      return [];
    }
  }

  async run() {
    // Clear output directory first
    console.log('🧹 Clearing output directory...');
    try {
      await fs.rm(this.config.outputDir, { recursive: true, force: true });
      await fs.mkdir(this.config.outputDir, { recursive: true });
      console.log(`✅ Cleared: ${this.config.outputDir}\n`);
    } catch (error) {
      console.log(`ℹ️  Output directory created: ${this.config.outputDir}\n`);
    }

    // Get teams from CSV for complete coverage
    const csvTeams = await this.getTeamsFromCSV();

    console.log('🔍 Scanning for user directories...');
    const userDirectories = await this.findUserDirectories();
    console.log(`📂 Found ${userDirectories.length} user directories in raw data\n`);

    // Process each user directory from raw data
    for (const userDir of userDirectories) {
      await this.processUserDirectory(userDir);
    }

    // Find missing users from CSV and create fallback images
    if (csvTeams.length > 0) {
      console.log('🔍 Checking for missing CSV users...');
      const processedSet = new Set(userDirectories.map(dir => this.sanitizeUserDir(dir)));
      const missingUsers = [];
      
      for (const team of csvTeams) {
        const sanitized = this.sanitizeUserDir(team);
        if (!processedSet.has(sanitized)) {
          missingUsers.push({ original: team, sanitized });
        }
      }
      
      if (missingUsers.length > 0) {
        console.log(`📝 Found ${missingUsers.length} missing users from CSV, creating fallback images...\n`);
        
        for (const user of missingUsers) {
          const outputDir = path.join(this.config.outputDir, user.sanitized);
          await fs.mkdir(outputDir, { recursive: true });
          console.log(`📁 ${user.original} → ${user.sanitized}: Creating fallback from random thumb`);
          await this.createThumbsFallback(user.original, outputDir);
          console.log('');
        }
      } else {
        console.log(`✅ All ${csvTeams.length} CSV teams have corresponding directories\n`);
      }
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('========================');
    console.log(`✅ Images processed: ${this.processedCount}`);
    console.log(`⏩ Images skipped: ${this.skippedCount}`);
    console.log(`❌ Errors: ${this.errorCount}`);
    console.log(`📦 Total size before: ${this.formatFileSize(this.totalSizeBefore)}`);
    console.log(`📦 Total size after: ${this.formatFileSize(this.totalSizeAfter)}`);
    
    if (this.totalSizeBefore > 0) {
      const totalReduction = ((this.totalSizeBefore - this.totalSizeAfter) / this.totalSizeBefore * 100).toFixed(1);
      const spaceSaved = this.formatFileSize(this.totalSizeBefore - this.totalSizeAfter);
      console.log(`💾 Space saved: ${spaceSaved} (${totalReduction}% reduction)`);
    }
    
    if (this.config.createBackup) {
      console.log(`\n📁 Original images backed up to: ${this.config.backupDir}`);
    }
    
    console.log('\n🎉 Image optimization completed!');
  }
}

// CLI Arguments Processing
function parseArguments() {
  const args = process.argv.slice(2);
  const config = { ...CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--size':
        if (args[i + 1]) {
          const [width, height] = args[i + 1].split('x').map(Number);
          if (width && height) {
            config.targetSize.width = width;
            config.targetSize.height = height;
          }
          i++;
        }
        break;
      case '--format':
        if (args[i + 1]) {
          config.outputFormat = args[i + 1];
          i++;
        }
        break;
      case '--no-backup':
        config.createBackup = false;
        break;
      case '--quality':
        if (args[i + 1]) {
          const quality = parseInt(args[i + 1]);
          if (quality >= 1 && quality <= 100) {
            config.jpeg.quality = quality;
            config.png.quality = quality;
            config.webp.quality = quality;
          }
          i++;
        }
        break;
      case '--help':
        console.log(`
M365 Raffle Image Optimizer

Usage: node scripts/optimizeImages.js [options]

Options:
  --size WIDTHxHEIGHT    Target size (default: 200x200)
  --format FORMAT        Output format: webp, jpeg, png (default: webp)
  --quality QUALITY      Image quality 1-100 (default: 90)
  --no-backup           Skip creating backup of original images
  --help                Show this help message

Examples:
  node scripts/optimizeImages.js
  node scripts/optimizeImages.js --size 150x150 --format jpeg --quality 85
  node scripts/optimizeImages.js --no-backup
        `);
        process.exit(0);
    }
  }
  
  return config;
}

// Main execution
async function main() {
  try {
    const config = parseArguments();
    const optimizer = new ImageOptimizer(config);
    
    await optimizer.init();
    await optimizer.run();
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ImageOptimizer, CONFIG };
