const http = require('http');
const fs = require('fs');
const path = require('path');

const dirPath = __dirname;

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const type = ext === '.html' || ext === '.htm' ? 'text/html' : 'text/plain';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/files') {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unable to list files' }));
        return;
      }
      const htmlFiles = files.filter(f => (f.endsWith('.html') || f.endsWith('.htm')) && f !== 'index.html');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(htmlFiles));
    });
  } else if (req.url === '/' || req.url === '/index.html') {
    sendFile(res, path.join(dirPath, 'index.html'));
  } else {
    const filePath = path.join(dirPath, req.url);
    sendFile(res, filePath);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
