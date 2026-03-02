'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const chokidar = require('chokidar');

const app = express();
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// API endpoint to upload files
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ success: true, filename: req.file.originalname });
});

// API endpoint to list available files
app.get('/api/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read files' });
    }
    const excelFiles = files.filter(f => /\.(xlsx|xls)$/.test(f));
    res.json({ files: excelFiles });
  });
});

// API endpoint to get file content
app.get('/api/files/:filename', (req, res) => {
  const filepath = path.join(UPLOAD_DIR, req.params.filename);
  
  // Security check - prevent directory traversal
  if (!filepath.startsWith(UPLOAD_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filepath);
});

// Watch for new files added to the folder
const watcher = chokidar.watch(UPLOAD_DIR, {
  ignored: /(^|[\/\\])\./,
  persistent: true,
});

let clients = [];

// SSE endpoint for file notifications
app.get('/api/watch', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const clientId = Date.now();
  clients.push(res);
  
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Notify clients when files change
function notifyClients(event, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!['.xlsx', '.xls'].includes(ext)) return;
  
  const data = {
    event,
    filename,
    timestamp: new Date().toISOString(),
  };
  
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

watcher.on('add', (filepath) => {
  const filename = path.basename(filepath);
  notifyClients('added', filename);
  console.log(`File added: ${filename}`);
});

watcher.on('unlink', (filepath) => {
  const filename = path.basename(filepath);
  notifyClients('removed', filename);
  console.log(`File removed: ${filename}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});