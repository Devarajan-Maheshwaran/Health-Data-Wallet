import express from 'express';

console.log('Starting test server...');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World! Test server is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});