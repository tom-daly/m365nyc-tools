import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Create output directories if they don't exist
const outputDir = './downloaded-images';
const maleDir = path.join(outputDir, 'male');
const femaleDir = path.join(outputDir, 'female');

// Ensure directories exist
[outputDir, maleDir, femaleDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Download an image from URL and save it to disk
 * @param {string} url - Image URL
 * @param {string} filepath - Local file path to save the image
 * @returns {Promise<boolean>} - Success status
 */
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
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
 * Add delay between downloads to be respectful to the server
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate and download portrait images
 * @param {string} sex - 'male' or 'female'
 * @param {number} count - Number of images to generate
 * @param {number} size - Image size (256 for 256x256)
 * @param {string} outputDirectory - Directory to save the images
 */
async function generateAndDownloadPortraits(sex, count, size, outputDirectory) {
    console.log(`\nGenerating and downloading ${count} ${sex} portraits (${size}x${size})...`);
    
    const imageData = [];
    const downloadedFiles = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 1; i <= count; i++) {
        try {
            // Generate a unique seed for each image to ensure variety
            faker.seed(Date.now() + i + Math.random() * 1000);
            
            // Generate the portrait URL
            const imageUrl = faker.image.personPortrait({
                sex: sex,
                size: size
            });
            
            // Create filename
            const filename = `${sex}_portrait_${i.toString().padStart(3, '0')}.jpg`;
            const filepath = path.join(outputDirectory, filename);
            
            // Generate additional fake user data
            const userData = {
                id: i,
                filename: filename,
                filepath: filepath,
                imageUrl: imageUrl,
                name: faker.person.fullName({ sex: sex }),
                email: faker.internet.email(),
                age: faker.number.int({ min: 18, max: 65 }),
                bio: faker.person.bio(),
                jobTitle: faker.person.jobTitle(),
                company: faker.company.name(),
                phone: faker.phone.number()
            };
            
            console.log(`📥 Downloading ${sex} portrait ${i}/${count}: ${userData.name}`);
            
            // Download the image
            await downloadImage(imageUrl, filepath);
            
            // Verify file was created and has content
            if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
                downloadedFiles.push(filepath);
                imageData.push(userData);
                successCount++;
                console.log(`✅ Successfully downloaded: ${filename}`);
            } else {
                throw new Error('Downloaded file is empty or missing');
            }
            
            // Add a small delay to be respectful to the server
            await delay(100); // 100ms delay between downloads
            
        } catch (error) {
            failCount++;
            console.error(`❌ Failed to download ${sex} portrait ${i}: ${error.message}`);
            
            // Continue with next image instead of stopping
            continue;
        }
    }
    
    // Save metadata to JSON file
    const jsonFile = path.join(outputDirectory, `${sex}_portraits_metadata.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(imageData, null, 2));
    
    // Save a simple list of downloaded files
    const filesListFile = path.join(outputDirectory, `${sex}_downloaded_files.txt`);
    fs.writeFileSync(filesListFile, downloadedFiles.join('\n'));
    
    console.log(`\n📊 ${sex.toUpperCase()} DOWNLOAD SUMMARY:`);
    console.log(`✅ Successfully downloaded: ${successCount}/${count}`);
    console.log(`❌ Failed downloads: ${failCount}/${count}`);
    console.log(`📁 Images saved to: ${outputDirectory}`);
    console.log(`📄 Metadata saved to: ${jsonFile}`);
    
    return { imageData, successCount, failCount, downloadedFiles };
}

/**
 * Main function to generate and download all portrait images
 */
async function main() {
    console.log('🎭 Faker.js Portrait Downloader');
    console.log('===============================');
    console.log('This will download actual image files to your computer!');
    
    const imageSize = 256; // 256x256 pixels
    const countPerGender = 100;
    
    try {
        console.log(`\n🚀 Starting download of ${countPerGender * 2} images...`);
        console.log(`📐 Image size: ${imageSize}x${imageSize} pixels`);
        console.log(`📁 Output directory: ${outputDir}`);
        
        const startTime = Date.now();
        
        // Download male portraits
        const maleResults = await generateAndDownloadPortraits('male', countPerGender, imageSize, maleDir);
        
        // Download female portraits  
        const femaleResults = await generateAndDownloadPortraits('female', countPerGender, imageSize, femaleDir);
        
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        
        // Create a combined summary
        const totalSuccess = maleResults.successCount + femaleResults.successCount;
        const totalFailed = maleResults.failCount + femaleResults.failCount;
        const totalAttempted = countPerGender * 2;
        
        const summaryData = {
            downloadSummary: {
                totalAttempted: totalAttempted,
                totalSuccessful: totalSuccess,
                totalFailed: totalFailed,
                successRate: `${((totalSuccess / totalAttempted) * 100).toFixed(1)}%`,
                downloadTimeSeconds: totalTime.toFixed(1)
            },
            malePortraits: {
                attempted: countPerGender,
                successful: maleResults.successCount,
                failed: maleResults.failCount,
                directory: maleDir
            },
            femalePortraits: {
                attempted: countPerGender,
                successful: femaleResults.successCount,
                failed: femaleResults.failCount,
                directory: femaleDir
            },
            imageSize: `${imageSize}x${imageSize}`,
            downloadedAt: new Date().toISOString(),
            allMaleData: maleResults.imageData,
            allFemaleData: femaleResults.imageData
        };
        
        const summaryFile = path.join(outputDir, 'download_summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2));
        
        console.log('\n🎉 DOWNLOAD COMPLETE!');
        console.log('=====================');
        console.log(`📊 Total images attempted: ${totalAttempted}`);
        console.log(`✅ Successfully downloaded: ${totalSuccess}`);
        console.log(`❌ Failed downloads: ${totalFailed}`);
        console.log(`📈 Success rate: ${summaryData.downloadSummary.successRate}`);
        console.log(`⏱️ Total download time: ${totalTime.toFixed(1)} seconds`);
        console.log(`👨 Male portraits: ${maleResults.successCount}/${countPerGender} in ${maleDir}`);
        console.log(`👩 Female portraits: ${femaleResults.successCount}/${countPerGender} in ${femaleDir}`);
        console.log(`📄 Complete summary: ${summaryFile}`);
        
        if (totalSuccess > 0) {
            console.log('\n📂 You can now find your downloaded images in:');
            console.log(`   Male images: ${path.resolve(maleDir)}`);
            console.log(`   Female images: ${path.resolve(femaleDir)}`);
        }
        
    } catch (error) {
        console.error('❌ Fatal error during download process:', error);
        process.exit(1);
    }
}

// Run the script
main();
