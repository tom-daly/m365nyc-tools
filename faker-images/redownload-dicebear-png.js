import fs from 'fs';
import path from 'path';
import https from 'https';

console.log('🚀 PNG re-download script starting...');

// Configuration
const CONVERT_CONFIG = {
    inputDir: './dicebear-avatars',
    outputDir: './dicebear-avatars-png',
    size: 256, // Target size
    format: 'png'
};

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
 * Re-download DiceBear avatars as PNG by extracting seeds from existing SVG files
 */
async function redownloadAsPng() {
    console.log('🔄 DiceBear SVG to PNG Re-downloader');
    console.log('====================================');
    
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
    
    console.log(`📊 Found ${svgFiles.length} SVG files to re-download as PNG`);
    console.log(`📐 Target size: ${CONVERT_CONFIG.size}x${CONVERT_CONFIG.size}`);
    console.log(`📁 Output directory: ${CONVERT_CONFIG.outputDir}`);
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < svgFiles.length; i++) {
        const inputPath = svgFiles[i];
        const filename = path.basename(inputPath, '.svg');
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
            console.log(`🔄 Re-downloading ${i + 1}/${svgFiles.length}: ${filename}`);
            
            // Extract seed and style from filename
            // Format: dicebear_thumbs_001_50u0UZ2LOy.svg
            const parts = filename.split('_');
            if (parts.length >= 4) {
                const style = parts[1];
                const seed = parts[3];
                
                // Build PNG URL
                const pngUrl = `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=${CONVERT_CONFIG.size}`;
                
                console.log(`🔗 Downloading from: ${pngUrl}`);
                
                await downloadFile(pngUrl, outputPath);
                
                // Verify the PNG was created and has content
                if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                    successCount++;
                    console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
                } else {
                    throw new Error('Output file is empty or missing');
                }
            } else {
                throw new Error('Cannot parse filename to extract seed and style');
            }
            
            // Add small delay to be respectful to API
            await delay(100);
            
        } catch (error) {
            failCount++;
            console.error(`❌ Failed to re-download ${filename}: ${error.message}`);
        }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log('');
    console.log('🎉 RE-DOWNLOAD COMPLETE!');
    console.log('========================');
    console.log(`✅ Successfully downloaded: ${successCount} files`);
    console.log(`❌ Failed downloads: ${failCount} files`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} seconds`);
    console.log(`📁 PNG files saved to: ${CONVERT_CONFIG.outputDir}`);
    
    // Create a summary file
    const summaryPath = path.join(CONVERT_CONFIG.outputDir, 'conversion_summary.json');
    const summary = {
        convertedAt: new Date().toISOString(),
        inputDirectory: CONVERT_CONFIG.inputDir,
        outputDirectory: CONVERT_CONFIG.outputDir,
        targetSize: `${CONVERT_CONFIG.size}x${CONVERT_CONFIG.size}`,
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

/**
 * Download a file from URL
 */
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
            
            file.on('error', (err) => {
                fs.unlink(filepath, () => {}); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Add delay between downloads
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    redownloadAsPng().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export { redownloadAsPng, CONVERT_CONFIG };
