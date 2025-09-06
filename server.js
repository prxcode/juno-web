import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import runJavaHandler from './api/runJava.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'build')));

app.post('/api/runJava', runJavaHandler);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
