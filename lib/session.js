// 🔐 Session Loader (IMMU-MD~base64)

const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const SESSION_DIR = path.join(__dirname, '..', 'data', 'session');

async function loadSession() {
  await fs.ensureDir(SESSION_DIR);

  if (!config.sessionId) return null;

  if (!config.sessionId.startsWith('IMMU-MD~')) {
    console.log('  ⚠️  Invalid session format');
    return null;
  }

  try {
    const base64 = config.sessionId.slice(8);
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const creds = JSON.parse(json);

    await fs.writeFile(
      path.join(SESSION_DIR, 'creds.json'),
      JSON.stringify(creds, null, 2)
    );

    console.log('  ✅ Session loaded');
    return SESSION_DIR;
  } catch (err) {
    console.log(`  ⚠️  Session error: ${err.message}`);
    return null;
  }
}

module.exports = { loadSession, getSessionDir: () => SESSION_DIR };
