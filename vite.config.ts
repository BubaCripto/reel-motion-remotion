import {defineConfig} from 'vite';
import {handleApiRequest} from './server/router';

export default defineConfig({
  plugins: [
    {
      name: 'reel-local-editor',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const handled = await handleApiRequest(req, res);
          if (!handled) next();
        });
      }
    }
  ]
});
