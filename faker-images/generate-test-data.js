import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
    outputBaseDir: './test-data',
    imageSourceDir: './downloaded-images',
    numberOfUsers: 200, // Updated to 200 for larger test dataset
    pointsRange: { min: 0, max: 10000 }, // Points range in hundreds
    submissionPointsRange: { min: 100, max: 400 } // Points deducted per submission
};

// Track used images to ensure each is only used once
const usedImages = {
    male: new Set(),
    female: new Set()
};

/**
 * Get available image files
 */
function getAvailableImages() {
    const maleDir = path.join(CONFIG.imageSourceDir, 'male');
    const femaleDir = path.join(CONFIG.imageSourceDir, 'female');
    
    const maleImages = fs.existsSync(maleDir) 
        ? fs.readdirSync(maleDir).filter(file => file.endsWith('.jpg'))
        : [];
    
    const femaleImages = fs.existsSync(femaleDir)
        ? fs.readdirSync(femaleDir).filter(file => file.endsWith('.jpg'))
        : [];
    
    return { maleImages, femaleImages };
}

/**
 * Get an unused image for the specified gender
 */
function getUnusedImage(gender, availableImages) {
    const genderImages = gender === 'male' ? availableImages.maleImages : availableImages.femaleImages;
    const usedSet = usedImages[gender];
    
    // Find unused images
    const unusedImages = genderImages.filter(img => !usedSet.has(img));
    
    if (unusedImages.length === 0) {
        console.warn(`⚠️ No more unused ${gender} images available!`);
        return null;
    }
    
    // Pick a random unused image
    const selectedImage = faker.helpers.arrayElement(unusedImages);
    usedSet.add(selectedImage);
    
    return selectedImage;
}

/**
 * Calculate submissions based on points
 * Points are deducted by random amounts (100-400) until they reach 0
 */
function calculateSubmissions(totalPoints) {
    let remainingPoints = totalPoints;
    let submissions = 0;
    
    while (remainingPoints > 0) {
        const minDeduction = Math.min(CONFIG.submissionPointsRange.min, remainingPoints);
        const maxDeduction = Math.min(CONFIG.submissionPointsRange.max, remainingPoints);
        
        const deduction = faker.number.int({ min: minDeduction, max: maxDeduction });
        remainingPoints -= deduction;
        submissions++;
        
        // Safety check to prevent infinite loops
        if (submissions > 1000) {
            console.warn('⚠️ Submission calculation safety limit reached');
            break;
        }
    }
    
    return submissions;
}

/**
 * Generate random points in hundreds
 */
function generateRandomPoints() {
    const hundreds = faker.number.int({ 
        min: CONFIG.pointsRange.min / 100, 
        max: CONFIG.pointsRange.max / 100 
    });
    return hundreds * 100;
}

/**
 * Copy image to user folder with custom name
 */
function copyImageToUserFolder(gender, imageName, userFolder) {
    const sourceImagePath = path.join(CONFIG.imageSourceDir, gender, imageName);
    const targetImageName = 'Believe in Your Selfie 😗🤳.jpg';
    const targetImagePath = path.join(userFolder, targetImageName);
    
    try {
        fs.copyFileSync(sourceImagePath, targetImagePath);
        return targetImagePath;
    } catch (error) {
        console.error(`❌ Failed to copy image ${imageName}:`, error.message);
        return null;
    }
}

/**
 * Generate a single user record
 */
function generateUser(availableImages, timestamp, userIndex) {
    // Predefined users for the first 2 entries
    const predefinedUsers = [
        {
            fullName: 'Teagan Daly',
            gender: 'female',
            specificImage: '001.jpg'
        },
        {
            fullName: 'Maci Daly',
            gender: 'female',
            specificImage: '002.jpg'
        }
    ];
    
    let fullName, gender, imageName, points;
    
    // Use predefined data for first 2 users
    if (userIndex <= 2 && predefinedUsers[userIndex - 1]) {
        const predefinedUser = predefinedUsers[userIndex - 1];
        fullName = predefinedUser.fullName;
        gender = predefinedUser.gender;
        imageName = predefinedUser.specificImage;
        points = 10000; // Static users get maximum points
        
        // Mark this specific image as used
        usedImages[gender].add(imageName);
    } else {
        // Generate random gender first, then generate name for that gender
        gender = faker.helpers.arrayElement(['male', 'female']);
        
        // Generate gender-specific name - be more explicit
        if (gender === 'male') {
            fullName = `${faker.person.firstName('male')} ${faker.person.lastName()}`;
        } else {
            fullName = `${faker.person.firstName('female')} ${faker.person.lastName()}`;
        }
        
        points = generateRandomPoints(); // Generated users get random points
        
        // 5% chance of not having a photo (skip image assignment)
        const skipPhoto = faker.number.float({ min: 0, max: 1 }) < 0.05;
        
        if (skipPhoto) {
            imageName = null; // No photo for this user
        } else {
            imageName = getUnusedImage(gender, availableImages);
        }
    }
    
    const submissions = calculateSubmissions(points);
    const lastSubmission = new Date().toISOString();
    
    return {
        fullName,
        gender,
        points,
        submissions,
        lastSubmission,
        imageName,
        timestamp,
        hasPhoto: imageName !== null
    };
}

/**
 * Main function to generate test data
 */
async function generateTestData() {
    // Create timestamp for this run
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const runFolder = path.join(CONFIG.outputBaseDir, timestamp);
    
    console.log('🎭 Test Data Generator');
    console.log('====================');
    console.log(`📅 Run timestamp: ${timestamp}`);
    console.log(`👥 Generating ${CONFIG.numberOfUsers} users`);
    console.log(`📁 Output folder: ${runFolder}`);
    
    // Create output directory
    if (!fs.existsSync(runFolder)) {
        fs.mkdirSync(runFolder, { recursive: true });
    }
    
    // Get available images
    const availableImages = getAvailableImages();
    console.log(`📸 Available images: ${availableImages.maleImages.length} male, ${availableImages.femaleImages.length} female`);
    
    if (availableImages.maleImages.length === 0 && availableImages.femaleImages.length === 0) {
        console.error('❌ No images found! Please run the download-images.js script first.');
        return;
    }
    
    // Generate users
    const users = [];
    const csvRows = ['Team,Points,Submissions,Last Submission']; // Header matching sample.csv
    
    console.log('\n👤 Generating users...');
    
    for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
        try {
            const user = generateUser(availableImages, timestamp, i);
            
            // Create user folder
            const userFolder = path.join(runFolder, user.fullName.replace(/[^a-zA-Z0-9\s]/g, ''));
            if (!fs.existsSync(userFolder)) {
                fs.mkdirSync(userFolder, { recursive: true });
            }
            
            // Copy image to user folder (only if user has a photo)
            let copiedImagePath = null;
            if (user.hasPhoto && user.imageName) {
                copiedImagePath = copyImageToUserFolder(user.gender, user.imageName, userFolder);
                if (copiedImagePath) {
                    user.imagePath = copiedImagePath;
                }
            }
            
            // Add user to list regardless of photo status
            users.push(user);
            
            // Add to CSV
            csvRows.push(`${user.fullName},${user.points},${user.submissions},${user.lastSubmission}`);
            
            const userType = i <= 2 ? '(predefined)' : '(generated)';
            const photoStatus = user.hasPhoto ? 'with photo' : 'NO PHOTO';
            console.log(`✅ Generated user ${i}/${CONFIG.numberOfUsers}: ${user.fullName} ${userType} (${user.gender}, ${user.points} pts, ${user.submissions} submissions) - ${photoStatus}`);
            
        } catch (error) {
            console.error(`❌ Error generating user ${i}:`, error.message);
        }
    }
    
    // Save CSV file
    const csvPath = path.join(runFolder, 'users.csv');
    fs.writeFileSync(csvPath, csvRows.join('\n'));
    
    // Save detailed JSON data
    const jsonPath = path.join(runFolder, 'users_detailed.json');
    const detailedData = {
        timestamp,
        generatedAt: new Date().toISOString(),
        config: CONFIG,
        totalUsers: users.length,
        usedImages: {
            male: Array.from(usedImages.male),
            female: Array.from(usedImages.female)
        },
        users
    };
    fs.writeFileSync(jsonPath, JSON.stringify(detailedData, null, 2));
    
    // Generate summary
    const genderCounts = users.reduce((acc, user) => {
        acc[user.gender] = (acc[user.gender] || 0) + 1;
        return acc;
    }, {});
    
    const photoCounts = users.reduce((acc, user) => {
        if (user.hasPhoto) {
            acc.withPhoto = (acc.withPhoto || 0) + 1;
        } else {
            acc.withoutPhoto = (acc.withoutPhoto || 0) + 1;
        }
        return acc;
    }, {});
    
    const pointsStats = {
        min: Math.min(...users.map(u => u.points)),
        max: Math.max(...users.map(u => u.points)),
        avg: Math.round(users.reduce((sum, u) => sum + u.points, 0) / users.length)
    };
    
    const submissionStats = {
        min: Math.min(...users.map(u => u.submissions)),
        max: Math.max(...users.map(u => u.submissions)),
        avg: Math.round(users.reduce((sum, u) => sum + u.submissions, 0) / users.length)
    };
    
    console.log('\n🎉 Generation Complete!');
    console.log('======================');
    console.log(`📊 Total users generated: ${users.length}`);
    console.log(`👨 Male users: ${genderCounts.male || 0}`);
    console.log(`👩 Female users: ${genderCounts.female || 0}`);
    console.log(`📸 Users with photos: ${photoCounts.withPhoto || 0}`);
    console.log(`🚫 Users without photos: ${photoCounts.withoutPhoto || 0} (${((photoCounts.withoutPhoto || 0) / users.length * 100).toFixed(1)}%)`);
    console.log(`📈 Points range: ${pointsStats.min} - ${pointsStats.max} (avg: ${pointsStats.avg})`);
    console.log(`📝 Submissions range: ${submissionStats.min} - ${submissionStats.max} (avg: ${submissionStats.avg})`);
    console.log(`📁 Data saved to: ${runFolder}`);
    console.log(`📄 CSV file: ${csvPath}`);
    console.log(`📄 Detailed JSON: ${jsonPath}`);
    
    return {
        timestamp,
        runFolder,
        users,
        csvPath,
        jsonPath
    };
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    generateTestData().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

export { generateTestData, CONFIG };
