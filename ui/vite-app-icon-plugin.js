import fs from 'node:fs';
import path from 'node:path';

const API_PATH = '/api/app-icon';

function resolveIconDir(config) {
  return path.resolve(config.root, 'public/icone');
}

function clearIconFiles(iconDir) {
  if (!fs.existsSync(iconDir)) return;
  for (const name of fs.readdirSync(iconDir)) {
    if (name === '.gitkeep') continue;
    fs.unlinkSync(path.join(iconDir, name));
  }
}

function mimeToExt(mime) {
  if (!mime) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('png')) return 'png';
  return 'png';
}

function attachAppIconMiddleware(server, iconDir) {
  server.middlewares.use((req, res, next) => {
    const url = req.url?.split('?')[0];
    if (url !== API_PATH) return next();

    if (req.method === 'DELETE') {
      try {
        clearIconFiles(iconDir);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method not allowed');
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', (err) => {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    });
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Empty file' }));
          return;
        }
        const mime = req.headers['content-type'] || 'image/png';
        const ext = mimeToExt(mime);
        fs.mkdirSync(iconDir, { recursive: true });
        clearIconFiles(iconDir);
        const filename = `app-icon.${ext}`;
        fs.writeFileSync(path.join(iconDir, filename), buffer);
        const version = Date.now();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            path: `/icone/${filename}`,
            version,
          }),
        );
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });
}

export function appIconPlugin() {
  let iconDir = '';
  return {
    name: 'app-icon-upload',
    configResolved(config) {
      iconDir = resolveIconDir(config);
    },
    configureServer(server) {
      attachAppIconMiddleware(server, iconDir);
    },
    configurePreviewServer(server) {
      attachAppIconMiddleware(server, iconDir);
    },
  };
}
