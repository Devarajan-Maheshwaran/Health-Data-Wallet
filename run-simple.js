// This is a simple wrapper to run our JavaScript server
// since we can't modify package.json directly
import { exec } from 'child_process';

// Start the simple server
const server = exec('node test-simple-server.js');

server.stdout.on('data', (data) => {
  console.log(data);
});

server.stderr.on('data', (data) => {
  console.error(data);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});