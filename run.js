import { spawn } from 'child_process';

console.log('Starting application...');

// Use the simplified in-memory server to avoid MongoDB issues
const serverProcess = spawn('node', ['simple-mem-server.js'], {
  stdio: 'inherit'
});

// Output any errors from the server process
serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

// Handle server process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});