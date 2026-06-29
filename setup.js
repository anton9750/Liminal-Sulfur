// setup.js
// Convenience first-run script: installs dependencies (if missing) and
// prints instructions for starting the game.
//
// Usage:  node setup.js
import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('=================================================');
console.log('  THE BACKROOMS — project setup');
console.log('=================================================');

if (!existsSync('./node_modules')) {
  console.log('Installing dependencies (three, vite)...');
  execSync('npm install', { stdio: 'inherit' });
} else {
  console.log('Dependencies already installed, skipping npm install.');
}

console.log('');
console.log('Setup complete! To start the game, run:');
console.log('');
console.log('   npm run dev');
console.log('');
console.log('Then open the printed local URL in your browser.');
console.log('=================================================');
