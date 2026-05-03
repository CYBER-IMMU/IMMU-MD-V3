# 🗿 IMMU MD V3 — Royal Edition

WhatsApp Multi-Device Bot built with Official Baileys.

---

## ✨ Features

- ✅ Always Online
- ✅ Auto Read Status
- ✅ Auto React Status (🚩 ❤️ ✅ ⚠️)
- ✅ Anti-Delete (deleted messages forwarded to your number)
- ✅ Anti View-Once via `.vv` command
- ✅ `.save` — Save status by replying
- ✅ Auto-follow channels & auto-join groups on first connect
- ✅ Pair-code first auth (no QR needed)
- ✅ Heroku 24/7 ready

---

## 🚀 Deploy

### First-time pairing (locally)

```bash
npm install
node index.js
```

The terminal will ask for your number → give pair code → enter on WhatsApp → after pairing your **Session ID** is sent to your own WhatsApp DM by the pair site.

Copy the `IMMU-MD~...` string.

### Deploy to Heroku

1. Push to GitHub
2. Click "Deploy to Heroku" using `app.json`
3. Set `SESSION_ID` env var to your `IMMU-MD~...` value
4. Bot deploys → connects → done!

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `.menu` | Show all commands |
| `.ping` | Bot speed test |
| `.alive` | Bot status |
| `.save` | Save status (reply to status) |
| `.vv` | Reveal view-once (reply to it) |

---

## 🔧 Environment Variables

See `.env.example`

---

> Powered by IMMU MD V3
