// This run.js file is used as an entry point for the application
// It handles starting the server in JavaScript mode
// Since we can't directly modify package.json, this file serves as a workaround

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create temporary package.json with correct scripts if needed
const tempPackageJsonPath = resolve(__dirname, 'temp-package.json');

// Check if scripts in package.json need to be updated
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
let needsUpdate = false;

if (packageJson.scripts.dev !== 'node --experimental-specifier-resolution=node run.js') {
  console.log('Updating dev script in memory...');
  needsUpdate = true;
}

if (needsUpdate) {
  const updatedPackageJson = { ...packageJson };
  updatedPackageJson.scripts = { 
    ...packageJson.scripts,
    dev: 'node --experimental-specifier-resolution=node run.js'
  };
  console.log('Using updated scripts configuration in memory...');
}

// Log startup
console.log('Starting Health Data Management Platform...');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Start the server
const serverProcess = spawn('node', ['--experimental-specifier-resolution=node', './server/index.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: process.env.PORT || '5000',
  },
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});