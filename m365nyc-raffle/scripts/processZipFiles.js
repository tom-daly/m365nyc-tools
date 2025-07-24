#!/usr/bin/env node

/**
 * ZIP File Processor for M365 Raffle
 * Automatically extracts zip files dropped in data/ folder and processes images
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');

class ZipProcessor {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.rawDir = path.join(this.dataDir, 'raw');
    this.tempDir = path.join(this.dataDir, '_temp');
    this.watchMode = false;
  }

  async init() {
    // Ensure directories exist
    await this.ensureDirectories();
    console.log('🗂️  ZIP Processor initialized');
    console.log(`📁 Watching: ${this.dataDir}`);
    console.log(`📁 Extract to: ${this.rawDir}`);
  }

  async ensureDirectories() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }

    try {
      await fs.access(this.rawDir);
    } catch {
      await fs.mkdir(this.rawDir, { recursive: true });
    }

    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async findZipFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter(file => file.toLowerCase().endsWith('.zip'));
    } catch (error) {
      console.error('❌ Error reading data directory:', error.message);
      return [];
    }
  }

  async extractZip(zipFilePath, extractToDir) {
    console.log(`📦 Extracting: ${path.basename(zipFilePath)}`);
    
    return new Promise((resolve, reject) => {
      fsSync.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: extractToDir }))
        .on('close', () => {
          console.log(`✅ Extracted to: ${extractToDir}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async findPhotosAndVideosFolder(baseDir) {
    // Recursively search for "Photos & Videos" folder
    const items = await fs.readdir(baseDir);
    
    for (const item of items) {
      if (item === 'Photos & Videos') {
        return path.join(baseDir, item);
      }
      
      const itemPath = path.join(baseDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory() && item !== '__MACOSX') {
        const found = await this.findPhotosAndVideosFolder(itemPath);
        if (found) return found;
      }
    }
    
    return null;
  }

  async movePhotosFromExtracted(extractedDir) {
    console.log(`📸 Looking for Photos & Videos folder in: ${extractedDir}`);
    
    // Recursively find the Photos & Videos folder
    const photosDir = await this.findPhotosAndVideosFolder(extractedDir);
    
    if (photosDir) {
      console.log(`📁 Found Photos & Videos folder at: ${photosDir}`);
      
      // Get all user folders
      const userFolders = await fs.readdir(photosDir);
      console.log(`👥 Found ${userFolders.length} user folders`);
      
      let successCount = 0;
      
      // Copy each user folder to data/raw
      for (const userFolder of userFolders) {
        const sourcePath = path.join(photosDir, userFolder);
        const destPath = path.join(this.rawDir, userFolder);
        
        // Check if it's a directory
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          console.log(`📋 Processing user: ${userFolder}`);
          
          // Ensure destination directory exists
          try {
            await fs.access(destPath);
          } catch {
            await fs.mkdir(destPath, { recursive: true });
          }
          
          // Copy all files from user folder
          const files = await fs.readdir(sourcePath);
          for (const file of files) {
            const sourceFile = path.join(sourcePath, file);
            const destFile = path.join(destPath, file);
            
            const fileStat = await fs.stat(sourceFile);
            if (fileStat.isFile()) {
              await fs.copyFile(sourceFile, destFile);
            }
          }
          
          successCount++;
        }
      }
      
      console.log(`✅ Moved ${successCount} user folders to data/raw`);
      
    } else {
      console.log(`⚠️  No Photos & Videos folder found, checking for direct user folders...`);
      
      // Fallback: look for user folders directly in the extracted directory
      const userCount = await this.moveDirectUserFolders(extractedDir);
      
      if (userCount > 0) {
        console.log(`✅ Moved ${userCount} user folders to data/raw`);
      } else {
        console.log(`❌ No user folders found in zip`);
      }
    }
  }

  async moveDirectUserFolders(baseDir) {
    const items = await fs.readdir(baseDir);
    let userCount = 0;
    
    for (const item of items) {
      const itemPath = path.join(baseDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory() && item !== '__MACOSX') {
        // Check if this directory contains image files
        const files = await fs.readdir(itemPath);
        const hasImages = files.some(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        
        if (hasImages) {
          console.log(`📋 Processing user: ${item}`);
          const destPath = path.join(this.rawDir, item);
          
          // Ensure destination directory exists
          try {
            await fs.access(destPath);
          } catch {
            await fs.mkdir(destPath, { recursive: true });
          }
          
          // Copy all files from user folder
          for (const file of files) {
            const sourceFile = path.join(itemPath, file);
            const destFile = path.join(destPath, file);
            
            const fileStat = await fs.stat(sourceFile);
            if (fileStat.isFile()) {
              await fs.copyFile(sourceFile, destFile);
            }
          }
          
          userCount++;
        } else {
          // Recursively check subdirectories
          const subCount = await this.moveDirectUserFolders(itemPath);
          userCount += subCount;
        }
      }
    }
    
    return userCount;
  }

  async processImages() {
    console.log('🎨 Starting batch image optimization...');
    
    return new Promise((resolve, reject) => {
      const batchProcess = spawn('node', ['scripts/batchOptimize.js', 'squid-game'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      batchProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Image optimization completed');
          resolve();
        } else {
          reject(new Error(`Batch optimization failed with code ${code}`));
        }
      });

      batchProcess.on('error', reject);
    });
  }

  async moveProcessedZip(zipFilePath) {
    const processedDir = path.join(this.dataDir, 'processed');
    
    try {
      await fs.access(processedDir);
    } catch {
      await fs.mkdir(processedDir, { recursive: true });
    }

    const fileName = path.basename(zipFilePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `${timestamp}_${fileName}`;
    const newPath = path.join(processedDir, newFileName);

    await fs.rename(zipFilePath, newPath);
    console.log(`📁 Moved processed zip to: ${newPath}`);
  }

  async processZipFile(zipFileName) {
    const zipFilePath = path.join(this.dataDir, zipFileName);
    const extractDir = path.join(this.tempDir, path.basename(zipFileName, '.zip'));

    try {
      console.log(`\n🔄 Processing: ${zipFileName}`);
      
      // Extract zip file to temp directory
      await this.extractZip(zipFilePath, extractDir);
      
      // Move photos from extracted directory to data/raw
      await this.movePhotosFromExtracted(extractDir);
      
      // Process images with batch optimizer
      await this.processImages();
      
      // Clean up temp directory
      await this.cleanupTemp(extractDir);
      
      // Move processed zip file
      await this.moveProcessedZip(zipFilePath);
      
      console.log(`🎉 Successfully processed: ${zipFileName}\n`);
      
    } catch (error) {
      console.error(`❌ Error processing ${zipFileName}:`, error.message);
      throw error;
    }
  }

  async cleanupTemp(extractDir) {
    try {
      await fs.rm(extractDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up temp directory: ${path.basename(extractDir)}`);
    } catch (error) {
      console.log(`⚠️  Could not cleanup temp directory: ${error.message}`);
    }
  }

  async processAllZips() {
    const zipFiles = await this.findZipFiles();
    
    if (zipFiles.length === 0) {
      console.log('📭 No zip files found in data/ directory');
      return;
    }

    console.log(`📦 Found ${zipFiles.length} zip file(s) to process`);
    
    for (const zipFile of zipFiles) {
      await this.processZipFile(zipFile);
    }
  }

  async watch() {
    this.watchMode = true;
    console.log('👀 Watching for new zip files... (Press Ctrl+C to stop)');
    
    // Process existing zips first
    await this.processAllZips();
    
    // Watch for new files
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(path.join(this.dataDir, '*.zip'), {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('add', async (filePath) => {
      const fileName = path.basename(filePath);
      console.log(`🆕 New zip file detected: ${fileName}`);
      
      // Wait a moment for file to be fully written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await this.processZipFile(fileName);
      } catch (error) {
        console.error(`❌ Failed to process ${fileName}:`, error.message);
      }
    });

    // Keep process alive
    return new Promise(() => {});
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === '--help' || command === '-h') {
    console.log(`
🗜️  M365 Raffle ZIP Processor

Usage: node scripts/processZipFiles.js [command]

Commands:
  process    Process all zip files in data/ folder (default)
  watch      Watch for new zip files and process automatically
  --help     Show this help message

The processor will:
1. Extract zip files to data/_raw/
2. Run batch image optimization (squid-game preset)
3. Move processed zips to data/processed/

Examples:
  npm run process:zips
  npm run process:zips watch
    `);
    return;
  }

  const processor = new ZipProcessor();
  await processor.init();

  if (command === 'watch') {
    await processor.watch();
  } else {
    await processor.processAllZips();
    console.log('🏁 ZIP processing complete');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { ZipProcessor };