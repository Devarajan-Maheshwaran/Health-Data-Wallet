import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  
  console.log('Setting up Vite middleware...');
  
  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      optimizeDeps: {
        entries: ['./client/index.html']
      },
      build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'client/index.html')
          }
        }
      }
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    console.log('Vite middleware configured');
    
    // Simple API route for testing
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'API is healthy' });
    });
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Simple test server running on http://localhost:${port}`);
    });
  } catch (e) {
    console.error('Error setting up Vite:', e);
  }
}

startServer();