import { createServer } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Get directory name for current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Logger for server messages
export function log(message, source = "express") {
  console.log(`[${source}] ${message}`);
}

// Set up Vite middleware for development
export async function setupVite(app, server) {
  try {
    // Create a Vite server
    const vite = await createServer({
      configFile: resolve(__dirname, '../vite.config.js'),
      server: {
        middlewareMode: true,
        hmr: {
          server: server
        }
      }
    });

    // Use Vite's middleware
    app.use(vite.middlewares);
    log("Vite middleware set up successfully", "vite");

    // Set up catch-all routes for client-side routing
    app.use('*', async (req, res, next) => {
      try {
        // If it's an API route, skip
        if (req.originalUrl.startsWith('/api/')) {
          return next();
        }

        // Get the client's entry HTML
        const template = await vite.transformIndexHtml(
          req.originalUrl,
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Health Data Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.jsx"></script>
  </body>
</html>`
        );

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        next(error);
      }
    });
  } catch (error) {
    console.error("Error setting up Vite:", error);
  }
}

// Serve static files in production
export function serveStatic(app) {
  // Serve client/dist as static files
  const staticPath = resolve(__dirname, '../client/dist');
  app.use(express.static(staticPath));
  
  log(`Serving static files from ${staticPath}`, "static");
  
  // Catch-all route for client-side routing in production
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return;
    }
    res.sendFile(resolve(staticPath, 'index.html'));
  });
}