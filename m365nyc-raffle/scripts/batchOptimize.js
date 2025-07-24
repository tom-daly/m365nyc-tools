#!/usr/bin/env node

/**
 * Quick Image Batch Processor
 * Simple interface for common image optimization tasks
 */

const { ImageOptimizer, CONFIG } = require('./optimizeImages.js');

const PRESETS = {
  'squid-game': {
    ...CONFIG,
    targetSize: { width: 200, height: 200 },
    outputFormat: 'webp',
    jpeg: { quality: 90 },
    png: { quality: 90 },
    webp: { quality: 90 },
    createBackup: true
  },
  
  'thumbnail': {
    ...CONFIG,
    avatarSize: { width: 200, height: 200 },
    thumbnailSize: { width: 50, height: 50 },
    outputFormat: 'webp',
    jpeg: { quality: 80 },
    png: { quality: 85 },
    webp: { quality: 85 },
    createBackup: true
  },
  
  'high-quality': {
    ...CONFIG,
    targetSize: { width: 400, height: 400 },
    outputFormat: 'webp',
    jpeg: { quality: 95 },
    png: { quality: 95 },
    webp: { quality: 95 },
    createBackup: true
  },
  
  'low-bandwidth': {
    ...CONFIG,
    targetSize: { width: 150, height: 150 },
    outputFormat: 'webp',
    jpeg: { quality: 70 },
    png: { quality: 75 },
    webp: { quality: 75 },
    createBackup: true
  }
};

async function main() {
  const preset = process.argv[2] || 'squid-game';
  
  if (preset === '--help' || preset === '-h') {
    console.log(`
🖼️  M365 Raffle Batch Image Processor

Usage: node scripts/batchOptimize.js [preset]

Available presets:
  squid-game     200x200 WebP, 90% quality (default)
  thumbnail      100x100 WebP, 85% quality  
  high-quality   400x400 WebP, 95% quality
  low-bandwidth  150x150 WebP, 75% quality

Examples:
  npm run optimize:batch
  npm run optimize:batch thumbnail
  npm run optimize:batch high-quality
    `);
    return;
  }
  
  const config = PRESETS[preset];
  if (!config) {
    console.error(`❌ Unknown preset: ${preset}`);
    console.log('Available presets:', Object.keys(PRESETS).join(', '));
    process.exit(1);
  }
  
  console.log(`🎯 Using preset: ${preset}`);
  if (config.avatarSize && config.thumbnailSize) {
    console.log(`📐 Avatar size: ${config.avatarSize.width}x${config.avatarSize.height}`);
    console.log(`📐 Thumbnail size: ${config.thumbnailSize.width}x${config.thumbnailSize.height}`);
  } else {
    console.log(`📐 Target size: ${config.targetSize.width}x${config.targetSize.height}`);
  }
  console.log(`🎨 Output format: ${config.outputFormat}`);
  console.log('');
  
  const optimizer = new ImageOptimizer(config);
  await optimizer.init();
  await optimizer.run();
}

if (require.main === module) {
  main().catch(console.error);
}
