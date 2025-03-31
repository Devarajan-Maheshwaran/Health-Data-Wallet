import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Log messages with source information
 * @param {string} message - Message to log
 * @param {string} source - Source of the message
 */
export function log(message, source = "express") {
  const timestamp = new Date().toISOString();
  const formattedSource = source.padEnd(10, ' ');
  console.log(`[${timestamp}] [${formattedSource}] ${message}`);
}

/**
 * Setup Vite middleware for development
 * @param {Express} app - Express application
 * @param {http.Server} server - HTTP server
 */
export async function setupVite(app, server) {
  const { createServer: createViteServer } = await import('vite');
  
  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: resolve(__dirname, '..'),
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    log("Vite development server started", "vite");
  } catch (e) {
    log(`Error setting up Vite: ${e}`, "vite");
    console.error(e);
    process.exit(1);
  }
}

/**
 * Serve static files in production
 * @param {Express} app - Express application
 */
export function serveStatic(app) {
  const clientDistPath = resolve(__dirname, '../dist');
  
  log(`Serving static files from ${clientDistPath}`, "static");
  
  app.use(express.static(clientDistPath, {
    index: false, // Let the SPA handle routing
    immutable: true,
    cacheControl: true,
    maxAge: '30d'
  }));
}