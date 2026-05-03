// ╔══════════════════════════════════════════╗
// ║       IMMU MD V3 — Royal Edition         ║
// ║       Powered by IMMU MD V3              ║
// ╚══════════════════════════════════════════╝

require('dotenv').config();

const path = require('path');
const express = require('express');
const config = require('./config');
const { startBot } = require('./lib/connect');
const { loadPlugins } = require('./lib/pluginLoader');

async function init() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║       IMMU MD V3 — Royal Edition     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Version : ${config.botVersion}`);
  console.log(`  Mode    : ${config.mode.toUpperCase()}`);
  console.log(`  Prefix  : ${config.prefix}`);
  console.log('');

  loadPlugins(path.join(__dirname, 'plugins'));

  // Web server (Heroku needs this for web dyno)
  const app = express();

  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>IMMU MD V3</title>
  <meta charset="UTF-8">
  <style>
    body{background:#000;color:#fff;font-family:monospace;text-align:center;padding:50px;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .c{padding:30px}
    h1{font-size:3em;background:linear-gradient(135deg,#FFD700,#FF6B6B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 10px}
    .badge{display:inline-block;padding:8px 24px;background:#00ff88;color:#000;border-radius:20px;font-weight:bold;margin:20px 0}
    p{color:#888;margin:8px 0}
    .v{color:#FFD700}
    .footer{margin-top:30px;color:#444;font-size:.85em}
  </style>
</head>
<body>
  <div class="c">
    <h1>🗿 IMMU MD V3</h1>
    <p class="v">Royal Edition</p>
    <div class="badge">● ONLINE</div>
    <p>Version ${config.botVersion}</p>
    <p>WhatsApp Multi-Device Bot</p>
    <div class="footer">${config.botFooter}</div>
  </div>
</body>
</html>`);
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      bot: config.botName,
      version: config.botVersion,
      uptime: process.uptime(),
    });
  });

  app.listen(config.port, () => {
    console.log(`  🌐 Web: http://localhost:${config.port}`);
  });

  console.log('');
  await startBot();
}

process.on('uncaughtException', (err) => {
  console.log(`  ❌ Uncaught: ${err.message}`);
});

process.on('unhandledRejection', (err) => {
  console.log(`  ❌ Rejection: ${err?.message || err}`);
});

init().catch((err) => {
  console.log(`  💀 Fatal: ${err.message}`);
  process.exit(1);
});
