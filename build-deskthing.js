
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function buildForDeskThing() {
  console.log('Building Discord Profile Pal for DeskThing...');
  
  // Ensure dist directory exists
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
  }
  
  // Copy manifest.json to dist
  fs.copyFileSync('./manifest.json', './dist/manifest.json');
  
  // Copy built server file to dist as index.js
  if (fs.existsSync('./server/dist/index.js')) {
    fs.copyFileSync('./server/dist/index.js', './dist/index.js');
  } else {
    console.error('Server build not found. Run "npm run build:server" first.');
    process.exit(1);
  }
  
  // Copy built client files
  if (fs.existsSync('./dist-client')) {
    // Copy all client files to dist
    const clientFiles = fs.readdirSync('./dist-client');
    clientFiles.forEach(file => {
      const srcPath = path.join('./dist-client', file);
      const destPath = path.join('./dist', file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    // Ensure index.html is in the root of dist
    if (fs.existsSync('./dist-client/index.html')) {
      fs.copyFileSync('./dist-client/index.html', './dist/index.html');
    }
  }
  
  // Create zip file
  const output = fs.createWriteStream('./discord-profile-pal-v1.0.0.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`Discord Profile Pal packaged: ${archive.pointer()} total bytes`);
    console.log('Ready for DeskThing deployment!');
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory('./dist/', false);
  archive.finalize();
}

buildForDeskThing().catch(console.error);
