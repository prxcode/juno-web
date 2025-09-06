import http from 'http';
import { runJavaHandler } from './api/runJava.js';

const server = http.createServer((req, res) => {
  if (req.url === '/runJava' && req.method === 'POST') {
    return runJavaHandler(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
