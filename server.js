const express = require('express');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3847;
const DATA_DIR = path.join(__dirname, 'pastes');
const MAX_AGE_HOURS = 24 * 7; // default 7 days

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Clean expired pastes on startup and every hour
function cleanup() {
  const now = Date.now();
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      if (data.expires && data.expires < now) {
        fs.unlinkSync(path.join(DATA_DIR, file));
      }
    } catch {}
  }
}
cleanup();
setInterval(cleanup, 60 * 60 * 1000);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/paste', (req, res) => {
  const { content, title = '', language = 'text', hours = 168 } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' });
  }
  if (content.length > 500_000) {
    return res.status(400).json({ error: 'content too large (max 500KB)' });
  }

  const id = nanoid(10);
  const expires = Date.now() + (Math.min(Number(hours) || 168, 24 * 30) * 60 * 60 * 1000);

  const paste = {
    id,
    title: String(title).slice(0, 120),
    language: String(language).slice(0, 30),
    content,
    created: new Date().toISOString(),
    expires
  };

  fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(paste, null, 2));
  res.json({ id, url: `/p/${id}` });
});

app.get('/p/:id', (req, res) => {
  const file = path.join(DATA_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).send('Paste not found or expired');
  }
  const paste = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (paste.expires && paste.expires < Date.now()) {
    fs.unlinkSync(file);
    return res.status(404).send('Paste expired');
  }
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/api/paste/:id', (req, res) => {
  const file = path.join(DATA_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
  const paste = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (paste.expires && paste.expires < Date.now()) {
    fs.unlinkSync(file);
    return res.status(404).json({ error: 'expired' });
  }
  res.json(paste);
});

app.listen(PORT, () => {
  console.log(`Local Pastebin running at http://localhost:${PORT}`);
});
