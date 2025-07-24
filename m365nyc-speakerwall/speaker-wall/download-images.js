import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const speakers = JSON.parse(fs.readFileSync('./src/speakers.json', 'utf8'));

const downloadDir = './public/images';

// Create directory if it doesn't exist
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

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
        console.log(`Downloaded: ${filename} (${response.headers['content-length']} bytes)`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(downloadDir, filename), () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(path.join(downloadDir, filename), () => {});
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log(`Downloading ${speakers.length} profile pictures...`);
  
  for (let i = 0; i < speakers.length; i++) {
    const speaker = speakers[i];
    const filename = `${i + 1}.jpg`;
    
    try {
      await downloadImage(speaker.profilePicture, filename);
      await new Promise(resolve => setTimeout(resolve, 200)); // Delay between downloads
    } catch (error) {
      console.error(`Failed to download ${speaker.fullName}: ${error.message}`);
    }
  }
  
  console.log('Download complete!');
}

downloadAllImages();