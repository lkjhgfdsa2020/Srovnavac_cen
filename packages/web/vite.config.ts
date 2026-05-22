import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import path from 'path'

const localApiPlugin = {
  name: 'local-api',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/api/add-product' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { url } = JSON.parse(body);
            if (!url) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'URL is required' }));
            }
            
            console.log(`[API] Adding product from URL: ${url}`);
            
            // Execute the script
            const rootDir = path.resolve(__dirname, '../../');
            const cmd = `NODE_OPTIONS="--max-http-header-size=65536" pnpm --filter crawler exec tsx src/cli/add-product.ts "${url}" && pnpm crawl`;
            
            exec(cmd, { cwd: rootDir }, (error, stdout, stderr) => {
              if (error) {
                console.error(`[API] exec error: ${error}`);
                console.error(stderr);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to add product or crawl.' }));
                return;
              }
              console.log(`[API] Add product success: ${stdout}`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            });
            
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          }
        });
      } else {
        next();
      }
    });
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin],
})
