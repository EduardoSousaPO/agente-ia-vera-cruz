import http from 'node:http';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const compiledApiDir = path.join(rootDir, '.tmp-api');
const port = Number(process.env.PORT || '4200');

const apiRoutes = new Map([
  ['/api/me', './me.js'],
  ['/api/leads_list', './leads_list.js'],
  ['/api/lead_detail', './lead_detail.js'],
  ['/api/metrics_summary', './metrics_summary.js'],
  ['/api/conversation_history', './conversation_history.js'],
  ['/api/lead_stage', './lead_stage.js'],
]);

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

function augmentResponse(res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };

  res.json = function json(payload) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
    return res;
  };

  return res;
}

function normalizeQuery(searchParams) {
  const query = {};
  for (const [key, value] of searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const current = query[key];
      query[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

async function handleApi(req, res, url) {
  const route = apiRoutes.get(url.pathname);
  if (!route) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const modulePath = pathToFileURL(path.join(compiledApiDir, route)).href;
  const { default: handler } = await import(modulePath);
  req.query = normalizeQuery(url.searchParams);

  if (req.method && req.method !== 'GET') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    req.body = rawBody ? JSON.parse(rawBody) : {};
  }

  await handler(req, augmentResponse(res));
}

function serveFile(filePath, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', contentTypeFor(filePath));
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url);
    } catch (err) {
      const message = err instanceof Error ? err.stack || err.message : String(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(message);
    }
    return;
  }

  const relativePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(distDir, relativePath);
  if (existsSync(filePath) && !filePath.endsWith(path.sep)) {
    serveFile(filePath, res);
    return;
  }

  serveFile(path.join(distDir, 'index.html'), res);
});

server.listen(port, '127.0.0.1', () => {
  const indexHtml = readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  console.log(`LOCAL_CRM_TEST_SERVER http://127.0.0.1:${port} index=${indexHtml.length}`);
});
