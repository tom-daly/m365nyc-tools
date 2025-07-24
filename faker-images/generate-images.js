import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// Create output directories if they don't exist
const outputDir = './generated-images';
const maleDir = path.join(outputDir, 'male');
const femaleDir = path.join(outputDir, 'female');

// Ensure directories exist
[outputDir, maleDir, femaleDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Generate portrait images using Faker.js personPortrait API
 * @param {string} sex - 'male' or 'female'
 * @param {number} count - Number of images to generate
 * @param {number} size - Image size (256 for 256x256)
 * @param {string} outputDirectory - Directory to save the image URLs
 */
async function generatePortraits(sex, count, size, outputDirectory) {
    console.log(`\nGenerating ${count} ${sex} portraits (${size}x${size})...`);
    
    const imageUrls = [];
    const imageData = [];
    
    for (let i = 1; i <= count; i++) {
        // Generate a unique seed for each image to ensure variety
        faker.seed(Date.now() + i + Math.random() * 1000);
        
        // Generate the portrait URL
        const imageUrl = faker.image.personPortrait({
            sex: sex,
            size: size
        });
        
        // Create additional fake user data to accompany each image
        const userData = {
            id: i,
            imageUrl: imageUrl,
            name: faker.person.fullName({ sex: sex }),
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 65 }),
            bio: faker.person.bio(),
            jobTitle: faker.person.jobTitle(),
            company: faker.company.name(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country()
            },
            phone: faker.phone.number(),
            website: faker.internet.url(),
            avatar: imageUrl // Same as imageUrl for consistency
        };
        
        imageUrls.push(imageUrl);
        imageData.push(userData);
        
        console.log(`✓ Generated ${sex} portrait ${i}/${count}: ${userData.name}`);
    }
    
    // Save URLs to a text file
    const urlsFile = path.join(outputDirectory, `${sex}_portrait_urls.txt`);
    fs.writeFileSync(urlsFile, imageUrls.join('\n'));
    
    // Save complete user data to JSON file
    const jsonFile = path.join(outputDirectory, `${sex}_users_data.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(imageData, null, 2));
    
    // Save a CSV file for easy importing into other tools
    const csvFile = path.join(outputDirectory, `${sex}_users_data.csv`);
    const csvHeaders = 'ID,Name,Email,Age,JobTitle,Company,Phone,ImageURL,Bio\n';
    const csvData = imageData.map(user => 
        `${user.id},"${user.name}","${user.email}",${user.age},"${user.jobTitle}","${user.company}","${user.phone}","${user.imageUrl}","${user.bio.replace(/"/g, '""')}"`
    ).join('\n');
    fs.writeFileSync(csvFile, csvHeaders + csvData);
    
    console.log(`📁 Saved ${count} ${sex} portrait URLs to: ${urlsFile}`);
    console.log(`📁 Saved ${count} ${sex} user data to: ${jsonFile}`);
    console.log(`📁 Saved ${count} ${sex} user data to: ${csvFile}`);
    
    return imageData;
}

/**
 * Main function to generate all portrait images
 */
async function main() {
    console.log('🎭 Faker.js Portrait Generator');
    console.log('==============================');
    
    const imageSize = 256; // 256x256 pixels
    const countPerGender = 100;
    
    try {
        // Generate male portraits
        const maleUsers = await generatePortraits('male', countPerGender, imageSize, maleDir);
        
        // Generate female portraits  
        const femaleUsers = await generatePortraits('female', countPerGender, imageSize, femaleDir);
        
        // Create a combined summary file
        const summaryData = {
            totalUsers: maleUsers.length + femaleUsers.length,
            maleUsers: maleUsers.length,
            femaleUsers: femaleUsers.length,
            imageSize: `${imageSize}x${imageSize}`,
            generatedAt: new Date().toISOString(),
            malePortraits: maleUsers,
            femalePortraits: femaleUsers
        };
        
        const summaryFile = path.join(outputDir, 'summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2));
        
        console.log('\n🎉 Generation Complete!');
        console.log('=======================');
        console.log(`📊 Total users generated: ${summaryData.totalUsers}`);
        console.log(`👨 Male users: ${summaryData.maleUsers}`);
        console.log(`👩 Female users: ${summaryData.femaleUsers}`);
        console.log(`📐 Image size: ${summaryData.imageSize}`);
        console.log(`📁 Summary saved to: ${summaryFile}`);
        
        // Display some sample URLs
        console.log('\n📸 Sample Image URLs:');
        console.log('Male:', maleUsers[0].imageUrl);
        console.log('Female:', femaleUsers[0].imageUrl);
        
    } catch (error) {
        console.error('❌ Error generating portraits:', error);
        process.exit(1);
    }
}

// Run the script
main();
