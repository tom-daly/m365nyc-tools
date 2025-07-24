import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import https from 'https';

console.log('🚀 DiceBear script starting...');

// Configuration for DiceBear downloads
const DICEBEAR_CONFIG = {
    outputDir: './dicebear-avatars',
    baseUrl: 'https://api.dicebear.com/9.x',
    numberOfAvatars: 50,
    styles: [
        'adventurer',
        'adventurer-neutral', 
        'avataaars',
        'avataaars-neutral',
        'big-ears',
        'big-ears-neutral',
        'big-smile',
        'bottts',
        'bottts-neutral',
        'croodles',
        'croodles-neutral',
        'fun-emoji',
        'identicon',
        'initials',
        'lorelei',
        'lorelei-neutral',
        'micah',
        'miniavs',
        'notionists',
        'notionists-neutral',
        'open-peeps',
        'personas',
        'pixel-art',
        'pixel-art-neutral',
        'rings',
        'shapes',
        'thumbs'
    ],
    defaultStyle: 'thumbs', // Default style if you want to use just one
    format: 'png', // svg or png
    size: 256 // Only applies to PNG format - increased to 256x256 to match portrait images
};

/**
 * Download an avatar from DiceBear API
 * @param {string} url - DiceBear API URL
 * @param {string} filepath - Local file path to save the avatar
 * @returns {Promise<boolean>} - Success status
 */
function downloadAvatar(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download avatar: ${response.statusCode}`));
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
 * Generate a random seed for DiceBear
 * This ensures we get different avatars each time
 */
function generateSeed() {
    return faker.string.alphanumeric(10);
}

/**
 * Build DiceBear URL with parameters
 * @param {string} style - Avatar style
 * @param {string} seed - Random seed for consistent avatar generation
 * @param {object} options - Additional options
 */
function buildDiceBearUrl(style, seed, options = {}) {
    const baseUrl = `${DICEBEAR_CONFIG.baseUrl}/${style}/${DICEBEAR_CONFIG.format}`;
    const params = new URLSearchParams({
        seed: seed,
        ...options
    });
    
    // Add size parameter for PNG format
    if (DICEBEAR_CONFIG.format === 'png') {
        params.append('size', DICEBEAR_CONFIG.size);
    }
    
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Add delay between downloads to be respectful to the API
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to download DiceBear avatars
 */
async function downloadDiceBearAvatars() {
    console.log('🎲 DiceBear Avatar Downloader');
    console.log('============================');
    console.log(`📁 Output directory: ${DICEBEAR_CONFIG.outputDir}`);
    console.log(`🎨 Using style: ${DICEBEAR_CONFIG.defaultStyle}`);
    console.log(`📊 Downloading ${DICEBEAR_CONFIG.numberOfAvatars} avatars`);
    console.log(`📐 Format: ${DICEBEAR_CONFIG.format.toUpperCase()}`);
    
    // Create output directory
    if (!fs.existsSync(DICEBEAR_CONFIG.outputDir)) {
        fs.mkdirSync(DICEBEAR_CONFIG.outputDir, { recursive: true });
    }
    
    const downloadedAvatars = [];
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();
    
    console.log('\n🚀 Starting downloads...\n');
    
    for (let i = 1; i <= DICEBEAR_CONFIG.numberOfAvatars; i++) {
        try {
            // Generate unique seed for this avatar
            const seed = generateSeed();
            
            // You can customize options per avatar here
            const options = {
                // backgroundColor: faker.color.rgb({ format: 'hex', prefix: '' }),
                // Add other style-specific options here
            };
            
            // Build the URL
            const avatarUrl = buildDiceBearUrl(DICEBEAR_CONFIG.defaultStyle, seed, options);
            
            // Create filename
            const filename = `dicebear_${DICEBEAR_CONFIG.defaultStyle}_${i.toString().padStart(3, '0')}_${seed}.${DICEBEAR_CONFIG.format}`;
            const filepath = path.join(DICEBEAR_CONFIG.outputDir, filename);
            
            console.log(`📥 Downloading avatar ${i}/${DICEBEAR_CONFIG.numberOfAvatars}: ${filename}`);
            console.log(`🔗 URL: ${avatarUrl}`);
            
            // Download the avatar
            await downloadAvatar(avatarUrl, filepath);
            
            // Verify file was created and has content
            if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
                const avatarData = {
                    id: i,
                    filename: filename,
                    filepath: filepath,
                    url: avatarUrl,
                    seed: seed,
                    style: DICEBEAR_CONFIG.defaultStyle,
                    format: DICEBEAR_CONFIG.format,
                    downloadedAt: new Date().toISOString()
                };
                
                downloadedAvatars.push(avatarData);
                successCount++;
                console.log(`✅ Successfully downloaded: ${filename}`);
            } else {
                throw new Error('Downloaded file is empty or missing');
            }
            
            // Add a small delay between downloads to be respectful
            await delay(200); // 200ms delay
            
        } catch (error) {
            failCount++;
            console.error(`❌ Failed to download avatar ${i}: ${error.message}`);
            continue;
        }
        
        console.log(''); // Empty line for readability
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // Save metadata
    const metadataFile = path.join(DICEBEAR_CONFIG.outputDir, 'avatars_metadata.json');
    const metadata = {
        downloadSummary: {
            totalAttempted: DICEBEAR_CONFIG.numberOfAvatars,
            totalSuccessful: successCount,
            totalFailed: failCount,
            successRate: `${((successCount / DICEBEAR_CONFIG.numberOfAvatars) * 100).toFixed(1)}%`,
            downloadTimeSeconds: totalTime.toFixed(1)
        },
        config: DICEBEAR_CONFIG,
        downloadedAt: new Date().toISOString(),
        avatars: downloadedAvatars
    };
    
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    // Save simple list file
    const listFile = path.join(DICEBEAR_CONFIG.outputDir, 'avatar_list.txt');
    const avatarList = downloadedAvatars.map(avatar => avatar.filename).join('\n');
    fs.writeFileSync(listFile, avatarList);
    
    console.log('🎉 DOWNLOAD COMPLETE!');
    console.log('====================');
    console.log(`📊 Total avatars attempted: ${DICEBEAR_CONFIG.numberOfAvatars}`);
    console.log(`✅ Successfully downloaded: ${successCount}`);
    console.log(`❌ Failed downloads: ${failCount}`);
    console.log(`📈 Success rate: ${metadata.downloadSummary.successRate}`);
    console.log(`⏱️ Total download time: ${totalTime.toFixed(1)} seconds`);
    console.log(`📁 Avatars saved to: ${path.resolve(DICEBEAR_CONFIG.outputDir)}`);
    console.log(`📄 Metadata saved to: ${metadataFile}`);
    console.log(`📄 List saved to: ${listFile}`);
    
    if (successCount > 0) {
        console.log('\n🎨 Available DiceBear Styles:');
        console.log(DICEBEAR_CONFIG.styles.join(', '));
        console.log('\nTo use different styles, modify the DICEBEAR_CONFIG.defaultStyle in the script!');
    }
    
    return {
        successCount,
        failCount,
        downloadedAvatars,
        metadata
    };
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    downloadDiceBearAvatars().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export { downloadDiceBearAvatars, DICEBEAR_CONFIG };
