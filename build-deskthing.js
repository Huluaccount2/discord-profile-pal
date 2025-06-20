
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

async function buildForDeskThing() {
  console.log('Building Discord Profile Pal for DeskThing v1.0+...');
  
  // Ensure dist directory exists
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
  }
  
  // Copy manifest.json to dist
  console.log('Copying manifest.json...');
  fs.copyFileSync('./manifest.json', './dist/manifest.json');
  
  // Copy built server file to dist as index.js (if it exists)
  if (fs.existsSync('./server/dist/index.js')) {
    console.log('Copying server build...');
    fs.copyFileSync('./server/dist/index.js', './dist/index.js');
  } else {
    console.log('No server build found, creating placeholder index.js...');
    // Create a minimal server file if none exists
    fs.writeFileSync('./dist/index.js', `
// Discord Profile Pal - DeskThing Server
console.log('Discord Profile Pal server starting...');

// Basic DeskThing server setup
if (typeof DeskThing !== 'undefined') {
  DeskThing.on('start', () => {
    console.log('Discord Profile Pal started successfully!');
  });
}
`);
  }
  
  // Copy built client files
  if (fs.existsSync('./dist-client')) {
    console.log('Copying client build...');
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
  } else {
    console.warn('No client build found at ./dist-client');
  }
  
  // Verify required files exist
  const requiredFiles = ['manifest.json'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join('./dist', file)));
  
  if (missingFiles.length > 0) {
    console.error('Missing required files:', missingFiles);
    process.exit(1);
  }
  
  console.log('Files in dist directory:');
  const distFiles = fs.readdirSync('./dist');
  distFiles.forEach(file => {
    const filePath = path.join('./dist', file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file} ${stats.isDirectory() ? '(directory)' : `(${stats.size} bytes)`}`);
  });
  
  // Create zip file with version number
  const zipName = `discord-profile-pal-v1.0.1.zip`;
  const output = fs.createWriteStream(`./${zipName}`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`Discord Profile Pal packaged: ${archive.pointer()} total bytes`);
    console.log(`Created: ${zipName}`);
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
