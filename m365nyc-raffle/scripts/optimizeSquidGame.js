#!/usr/bin/env node

/**
 * Squid Game Ultra-Compact Image Optimizer
 * Creates 50x50 ultra-optimized images for maximum performance
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Configuration for ultra-compact Squid Game images
const CONFIG = {
  sourceDir: path.join(process.cwd(), 'public'),
  targetSize: {
    width: 50,
    height: 50
  },
  outputSubfolder: 'thumbnail',  // Changed from '50x50' to 'thumbnail'
  
  // Ultra-aggressive optimization settings
  webp: {
    quality: 60,      // Lower quality for maximum compression
    effort: 6,        // Maximum compression effort
    lossless: false,  // Use lossy compression
    nearLossless: false,
    smartSubsample: true,
    preset: 'photo'
  },
  
  // Fallback AVIF (even better compression)
  avif: {
    quality: 55,
    effort: 9,        // Maximum effort for AVIF
    speed: 1          // Slowest/best compression
  },
  
  // Processing options
  fit: 'cover',
  withoutEnlargement: false, // Allow upscaling for consistency
  background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
  
  // Format preference (AVIF > WebP > JPEG)
  preferredFormat: 'avif', // Most modern and compact
  fallbackFormat: 'webp'   // Good browser support
};

class SquidGameOptimizer {
  constructor() {
    this.processedCount = 0;
    this.errorCount = 0;
    this.totalSizeBefore = 0;
    this.totalSizeAfter = 0;
  }

  async init() {
    console.log('🎮 Squid Game Ultra-Compact Image Optimizer');
    console.log('============================================');
    console.log(`📐 Target size: ${CONFIG.targetSize.width}x${CONFIG.targetSize.height} pixels`);
    console.log(`📁 Output folder: ${CONFIG.outputSubfolder}/`);
    console.log(`📝 Filename format: [person-name-lowercase].${CONFIG.preferredFormat}`);
    console.log(`🎨 Format: ${CONFIG.preferredFormat.toUpperCase()} (fallback: ${CONFIG.fallbackFormat.toUpperCase()})`);
    console.log(`🗜️  Quality: ${CONFIG.avif.quality}% (ultra-aggressive compression)`);
    console.log('');
  }

  async findUserDirectories() {
    const entries = await fs.readdir(CONFIG.sourceDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.') && 
                      entry.name !== 'originals-backup' && 
                      entry.name !== 'photos' &&
                      entry.name !== CONFIG.outputSubfolder)
      .map(entry => entry.name);
  }

  async findImagesInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.avif'];
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return supportedFormats.includes(ext);
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
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async optimizeImage(sourcePath, userDir, fileName) {
    try {
      const originalSize = await this.getFileSize(sourcePath);
      this.totalSizeBefore += originalSize;

      // Create output directory
      const outputDir = path.join(CONFIG.sourceDir, userDir, CONFIG.outputSubfolder);
      await fs.mkdir(outputDir, { recursive: true });

      // Get image info
      const image = sharp(sourcePath);
      const metadata = await image.metadata();
      
      console.log(`  📊 Original: ${metadata.width}x${metadata.height}, ${this.formatFileSize(originalSize)}`);

      // Ultra-aggressive processing pipeline
      let processedImage = image
        .resize({
          width: CONFIG.targetSize.width,
          height: CONFIG.targetSize.height,
          fit: CONFIG.fit,
          withoutEnlargement: CONFIG.withoutEnlargement,
          background: CONFIG.background
        })
        .sharpen(0.5, 1, 2) // Slight sharpening for small images
        .modulate({
          brightness: 1.05,  // Slight brightness boost
          saturation: 1.1    // Slight saturation boost
        });

      // Generate filename using person's name in lowercase
      const personNameLowercase = userDir.toLowerCase().replace(/[^a-z0-9]/g, '-');
      let outputPath = path.join(outputDir, `${personNameLowercase}.${CONFIG.preferredFormat}`);
      
      try {
        if (CONFIG.preferredFormat === 'avif') {
          await processedImage.avif(CONFIG.avif).toFile(outputPath);
        } else {
          await processedImage.webp(CONFIG.webp).toFile(outputPath);
        }
      } catch (error) {
        // Fallback to WebP if AVIF fails
        console.log(`  ⚠️  ${CONFIG.preferredFormat.toUpperCase()} failed, falling back to ${CONFIG.fallbackFormat.toUpperCase()}`);
        outputPath = path.join(outputDir, `${personNameLowercase}.${CONFIG.fallbackFormat}`);
        await processedImage.webp(CONFIG.webp).toFile(outputPath);
      }
      
      const optimizedSize = await this.getFileSize(outputPath);
      this.totalSizeAfter += optimizedSize;
      
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      const finalFormat = path.extname(outputPath).substring(1).toUpperCase();
      const finalFilename = path.basename(outputPath);
      
      console.log(`  ✅ ${finalFormat}: ${finalFilename} - ${this.formatFileSize(optimizedSize)} (${compressionRatio}% reduction)`);
      
      this.processedCount++;
      
    } catch (error) {
      console.error(`  ❌ Error processing ${fileName}: ${error.message}`);
      this.errorCount++;
    }
  }

  async processUserDirectory(userDir) {
    const userDirPath = path.join(CONFIG.sourceDir, userDir);
    const images = await this.findImagesInDirectory(userDirPath);
    
    if (images.length === 0) {
      console.log(`📁 ${userDir}: No images found`);
      return;
    }

    console.log(`📁 ${userDir}: Processing ${images.length} image(s)`);
    
    for (const image of images) {
      // Skip if it's already in the 50x50 folder
      if (image.includes(CONFIG.outputSubfolder)) continue;
      
      const sourcePath = path.join(userDirPath, image);
      
      console.log(`  🔄 Processing: ${image}`);
      await this.optimizeImage(sourcePath, userDir, image);
    }
    
    console.log('');
  }

  async run() {
    console.log('🔍 Scanning for user directories...');
    const userDirectories = await this.findUserDirectories();
    console.log(`📂 Found ${userDirectories.length} user directories\n`);

    if (userDirectories.length === 0) {
      console.log('❌ No user directories found to process');
      return;
    }

    // Process each user directory
    for (const userDir of userDirectories) {
      await this.processUserDirectory(userDir);
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('🎮 SQUID GAME OPTIMIZATION SUMMARY');
    console.log('==================================');
    console.log(`✅ Images processed: ${this.processedCount}`);
    console.log(`❌ Errors: ${this.errorCount}`);
    console.log(`📦 Total size before: ${this.formatFileSize(this.totalSizeBefore)}`);
    console.log(`📦 Total size after: ${this.formatFileSize(this.totalSizeAfter)}`);
    
    if (this.totalSizeBefore > 0) {
      const totalReduction = ((this.totalSizeBefore - this.totalSizeAfter) / this.totalSizeBefore * 100).toFixed(1);
      const spaceSaved = this.formatFileSize(this.totalSizeBefore - this.totalSizeAfter);
      console.log(`💾 Space saved: ${spaceSaved} (${totalReduction}% reduction)`);
      
      const avgSizeAfter = this.totalSizeAfter / this.processedCount;
      console.log(`📏 Average file size: ${this.formatFileSize(avgSizeAfter)}`);
    }
    
    console.log(`\n📁 Ultra-compact images saved to: /public/[username]/${CONFIG.outputSubfolder}/`);
    console.log('🎉 Squid Game optimization completed!');
    console.log('\n💡 Usage in React:');
    console.log('   <img src="/[username]/thumbnail/[person-name-lowercase].avif" width="50" height="50" />');
    console.log('\n📝 Example filenames:');
    console.log('   Aaron Jones → aaron-jones.avif');
    console.log('   Dr. Alison Herrera → dr--alison-herrera.avif');
    console.log('   Mrs. Mary Conner → mrs--mary-conner.avif');
  }
}

// Main execution
async function main() {
  try {
    const optimizer = new SquidGameOptimizer();
    await optimizer.init();
    await optimizer.run();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SquidGameOptimizer };
