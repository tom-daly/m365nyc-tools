import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Configuration
const CONVERT_CONFIG = {
    inputDir: './dicebear-avatars',
    outputDir: './dicebear-avatars-png',
    size: '256x256', // Target size (same as portrait images)
    quality: 90, // PNG quality
    background: 'white' // Background color for transparent SVGs
};

/**
 * Check if ImageMagick is available
 */
function checkImageMagick() {
    return new Promise((resolve) => {
        const magick = spawn('magick', ['-version'], { stdio: 'pipe' });
        
        magick.on('close', (code) => {
            resolve(code === 0);
        });
        
        magick.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Convert SVG to PNG using ImageMagick
 */
function convertSvgToPng(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const args = [
            inputPath,
            '-background', CONVERT_CONFIG.background,
            '-resize', CONVERT_CONFIG.size,
            '-quality', CONVERT_CONFIG.quality.toString(),
            outputPath
        ];
        
        const magick = spawn('magick', args, { stdio: 'pipe' });
        
        let stderr = '';
        magick.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        magick.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error(`ImageMagick failed: ${stderr}`));
            }
        });
        
        magick.on('error', (err) => {
            reject(new Error(`Failed to run ImageMagick: ${err.message}`));
        });
    });
}

/**
 * Get all SVG files recursively from directory
 */
function getAllSvgFiles(dirPath) {
    const svgFiles = [];
    
    function scanDirectory(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (path.extname(item).toLowerCase() === '.svg') {
                svgFiles.push(fullPath);
            }
        }
    }
    
    if (fs.existsSync(dirPath)) {
        scanDirectory(dirPath);
    }
    
    return svgFiles;
}

/**
 * Main conversion function
 */
async function convertDiceBearToPng() {
    console.log('🔄 DiceBear SVG to PNG Converter');
    console.log('================================');
    
    // Check if ImageMagick is available
    console.log('🔍 Checking for ImageMagick...');
    const hasImageMagick = await checkImageMagick();
    
    if (!hasImageMagick) {
        console.error('❌ ImageMagick not found!');
        console.log('📝 Please install ImageMagick:');
        console.log('   Windows: Download from https://imagemagick.org/script/download.php#windows');
        console.log('   macOS: brew install imagemagick');
        console.log('   Linux: sudo apt-get install imagemagick');
        process.exit(1);
    }
    
    console.log('✅ ImageMagick found');
    
    // Check input directory
    if (!fs.existsSync(CONVERT_CONFIG.inputDir)) {
        console.error(`❌ Input directory not found: ${CONVERT_CONFIG.inputDir}`);
        console.log('💡 Run the DiceBear download script first!');
        process.exit(1);
    }
    
    // Create output directory
    if (!fs.existsSync(CONVERT_CONFIG.outputDir)) {
        fs.mkdirSync(CONVERT_CONFIG.outputDir, { recursive: true });
    }
    
    // Find all SVG files
    const svgFiles = getAllSvgFiles(CONVERT_CONFIG.inputDir);
    
    if (svgFiles.length === 0) {
        console.error('❌ No SVG files found in input directory');
        process.exit(1);
    }
    
    console.log(`📊 Found ${svgFiles.length} SVG files to convert`);
    console.log(`📐 Target size: ${CONVERT_CONFIG.size}`);
    console.log(`📁 Output directory: ${CONVERT_CONFIG.outputDir}`);
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < svgFiles.length; i++) {
        const inputPath = svgFiles[i];
        const relativePath = path.relative(CONVERT_CONFIG.inputDir, inputPath);
        const outputPath = path.join(
            CONVERT_CONFIG.outputDir,
            relativePath.replace(/\.svg$/i, '.png')
        );
        
        // Create output subdirectory if needed
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        try {
            console.log(`🔄 Converting ${i + 1}/${svgFiles.length}: ${relativePath}`);
            
            await convertSvgToPng(inputPath, outputPath);
            
            // Verify the PNG was created and has content
            if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                successCount++;
                console.log(`✅ Converted: ${path.basename(outputPath)}`);
            } else {
                throw new Error('Output file is empty or missing');
            }
            
        } catch (error) {
            failCount++;
            console.error(`❌ Failed to convert ${relativePath}: ${error.message}`);
        }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log('');
    console.log('🎉 CONVERSION COMPLETE!');
    console.log('=======================');
    console.log(`✅ Successfully converted: ${successCount} files`);
    console.log(`❌ Failed conversions: ${failCount} files`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} seconds`);
    console.log(`📁 PNG files saved to: ${CONVERT_CONFIG.outputDir}`);
    
    // Create a summary file
    const summaryPath = path.join(CONVERT_CONFIG.outputDir, 'conversion_summary.json');
    const summary = {
        convertedAt: new Date().toISOString(),
        inputDirectory: CONVERT_CONFIG.inputDir,
        outputDirectory: CONVERT_CONFIG.outputDir,
        targetSize: CONVERT_CONFIG.size,
        totalFiles: svgFiles.length,
        successCount,
        failCount,
        conversionTimeSeconds: totalTime,
        config: CONVERT_CONFIG
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary saved: ${summaryPath}`);
    
    return summary;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    convertDiceBearToPng().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export { convertDiceBearToPng, CONVERT_CONFIG };
