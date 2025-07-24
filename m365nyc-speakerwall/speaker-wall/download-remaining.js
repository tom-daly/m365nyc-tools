import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const speakers = JSON.parse(fs.readFileSync('./src/speakers.json', 'utf8'));
const downloadDir = './public/images';

const missingImages = [];

// Check which images are missing or empty
for (let i = 1; i <= speakers.length; i++) {
  const imagePath = path.join(downloadDir, `${i}.jpg`);
  if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size === 0) {
    missingImages.push(i);
  }
}

console.log(`Found ${missingImages.length} missing images:`, missingImages);

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(downloadDir, filename));
    
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(path.join(downloadDir, filename), () => {});
        return downloadImage(response.headers.location, filename).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(path.join(downloadDir, filename), () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(downloadDir, filename), () => {});
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(path.join(downloadDir, filename), () => {});
      reject(err);
    });
  });
}

async function downloadMissingImages() {
  for (const imageNum of missingImages) {
    const speaker = speakers[imageNum - 1];
    const filename = `${imageNum}.jpg`;
    
    try {
      await downloadImage(speaker.profilePicture, filename);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    } catch (error) {
      console.error(`Failed to download ${speaker.fullName}: ${error.message}`);
    }
  }
  
  console.log('Download complete!');
}

downloadMissingImages();