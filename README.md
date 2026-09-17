# Local Pastebin

A real self-hosted pastebin / code snippet sharing tool.

## Features
- Create pastes with optional title + language
- Automatic expiry (1 day / 7 days / 30 days)
- Clean dark UI
- No database — just JSON files
- Runs fully offline on your machine

## Run
```bash
npm install
npm start
```

Open http://localhost:3847

Pastes are stored in the `pastes/` folder and cleaned up automatically when expired.
