// 🔌 Connection — Heroku-ready with all features

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  downloadMediaMessage,
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const readline = require('readline');

const config = require('../config');
const { loadSession, getSessionDir } = require('./session');
const { handleMessage } = require('./messageHandler');
const { saveMessage, getMessage } = require('./messageStore');
const { forwardedContext } = require('./helpers');

const logger = pino({ level: 'silent' });
let sock = null;
let isReconnecting = false;
let firstConnect = true;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function startBot() {
  await loadSession();
  const sessionDir = getSessionDir();
  await fs.ensureDir(sessionDir);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  const hasSession = !!state.creds.registered;

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: config.alwaysOnline,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async (key) => {
      const m = getMessage(key.id);
      return m?.message || { conversation: 'IMMU MD V3' };
    },
  });

  // ─── PAIR CODE FLOW (when no session) ────
  if (!hasSession && config.usePairCode && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        console.log('');
        console.log('  ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮');
        console.log('  │     IMMU MD V3 — PAIR        │');
        console.log('  ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
        console.log('');

        const number = await ask('  📱 Enter WhatsApp number (with country code, no +): ');
        const cleaned = number.replace(/[\s\-\+()]/g, '');

        if (!/^\d{10,15}$/.test(cleaned)) {
          console.log('  ❌ Invalid number');
          process.exit(1);
        }

        console.log('');
        console.log('  ⏳ Requesting pair code...');
        await new Promise(r => setTimeout(r, 2000));

        const code = await sock.requestPairingCode(cleaned);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log('');
        console.log('  ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮');
        console.log(`  │   🔐 PAIR CODE: ${formatted.padEnd(13)}│`);
        console.log('  ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
        console.log('');
        console.log('  📲 WhatsApp → Settings → Linked Devices');
        console.log('     → Link a Device → Link with Phone Number');
        console.log('     Enter the code above ⬆️');
        console.log('');
      } catch (err) {
        console.log(`  ❌ Pair error: ${err.message}`);
      }
    }, 3000);
  }

  // ─── CONNECTION EVENTS ─────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      console.log('  🔄 Connecting...');
    }

    if (connection === 'open') {
      console.log('');
      console.log('  ✅ Bot Connected');
      console.log('  ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮');
      console.log('  │     IMMU MD V3 is LIVE       │');
      console.log('  ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯');
      console.log('');

      isReconnecting = false;

      // Always online
      try { await sock.sendPresenceUpdate('available'); } catch (_) {}

      // First connect: auto-follow channel + auto-join group + send welcome
      if (firstConnect) {
        firstConnect = false;
        await handleFirstConnect();
      }
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`  ⚠️  Disconnected (${reason})`);

      if (reason === DisconnectReason.loggedOut) {
        console.log('  🚪 Logged out');
        await fs.emptyDir(getSessionDir());
        process.exit(0);
      } else if (!isReconnecting) {
        isReconnecting = true;
        const delay = reason === DisconnectReason.restartRequired ? 1000 : 5000;
        setTimeout(() => startBot(), delay);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ─── MESSAGES UPSERT ───────────────────────
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      try {
        // Save for anti-delete
        saveMessage(msg);

        // Status broadcast handling
        if (msg.key.remoteJid === 'status@broadcast') {
          await handleStatusAuto(msg);
          continue;
        }

        // Anti view-once: Auto-capture (sends to owner immediately)
        // NOTE: User wants .vv command instead — so we do NOT auto-forward
        // We just save the message; .vv command handles forwarding

        await handleMessage(sock, msg);
      } catch (err) {
        console.log(`  ⚠️  Msg error: ${err.message}`);
      }
    }
  });

  // ─── ANTI-DELETE ───────────────────────────
  sock.ev.on('messages.update', async (updates) => {
    if (!config.antiDelete) return;

    for (const update of updates) {
      try {
        const { key, update: u } = update;
        if (key.fromMe) continue;
        if (key.remoteJid === 'status@broadcast') continue;

        const original = getMessage(key.id);
        if (!original) continue;

        // Detect deletion
        if (u?.message === null || u?.messageStubType === 1) {
          await forwardDeleted(original);
        }
      } catch (err) {
        console.log(`  ⚠️  AntiDel: ${err.message}`);
      }
    }
  });

  // ─── ANTI-CALL (optional) ──────────────────
  sock.ev.on('call', async (calls) => {
    if (!config.antiCall) return;
    for (const call of calls) {
      if (call.status === 'offer') {
        try {
          await sock.rejectCall(call.id, call.from);
        } catch (_) {}
      }
    }
  });

  return sock;
}

// ─── FIRST CONNECT TASKS ────────────────────
async function handleFirstConnect() {
  try {
    const myJid = sock.user?.id;
    if (!myJid) return;

    const myNumber = myJid.split(':')[0].split('@')[0];
    const ownerJid = jidNormalizedUser(myNumber + '@s.whatsapp.net');

    // Auto-follow channels (silently)
    for (const ch of config.autoFollowChannels) {
      try {
        await sock.newsletterFollow(ch);
        console.log(`  ✅ Followed: ${ch}`);
      } catch (_) {}
      await new Promise(r => setTimeout(r, 500));
    }

    // Auto-join groups (silently)
    for (const code of config.autoJoinGroups) {
      try {
        await sock.groupAcceptInvite(code);
        console.log(`  ✅ Joined: ${code}`);
      } catch (_) {}
      await new Promise(r => setTimeout(r, 500));
    }

    // Send welcome message
    const welcome = `╭━━━━━━━━━━━━━━━━╮
┃    *${config.botName}*
┃    *\`Royal Edition\`*
╰━━━━━━━━━━━━━━━━╯

┃ ✅ *Bot Connected*
┃ ⚙️ Mode    ➤ ${config.mode.toUpperCase()}
┃ 🔧 Prefix  ➤ ${config.prefix}
┃ 🏷️ Version ➤ ${config.botVersion}
┃ 📅 Status  ➤ Online

┃ Type *${config.prefix}menu* to see all commands

> *${config.botFooter}*`;

    await sock.sendMessage(ownerJid, {
      image: { url: config.botPic },
      caption: welcome,
      contextInfo: forwardedContext(config),
    });
  } catch (err) {
    console.log(`  ⚠️  Welcome: ${err.message}`);
  }
}

// ─── ANTI-DELETE FORWARD ───────────────────
async function forwardDeleted(original) {
  try {
    const myJid = sock.user?.id;
    if (!myJid) return;

    const myNumber = myJid.split(':')[0].split('@')[0];
    const ownerJid = jidNormalizedUser(myNumber + '@s.whatsapp.net');

    const senderNumber = (original.key.participant || original.key.remoteJid).split('@')[0];
    const isGroup = original.key.remoteJid.endsWith('@g.us');

    let chatName = 'DM';
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(original.key.remoteJid);
        chatName = meta.subject || 'Group';
      } catch (_) {}
    }

    // Header
    await sock.sendMessage(ownerJid, {
      text: `╭━━〔 *🛡️ DELETED MESSAGE* 〕━━╮
┃
┃ 👤 From: +${senderNumber}
┃ 💬 Chat: ${chatName}
┃ 🕐 Time: ${new Date().toLocaleString()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
    });

    // Re-send original
    const m = original.message;
    if (m.conversation || m.extendedTextMessage?.text) {
      const txt = m.conversation || m.extendedTextMessage.text;
      await sock.sendMessage(ownerJid, { text: `💬 *Deleted text:*\n\n${txt}` });
    } else if (m.imageMessage || m.videoMessage || m.audioMessage || m.stickerMessage || m.documentMessage) {
      try {
        const buffer = await downloadMediaMessage(original, 'buffer', {}, { logger });
        const caption = m.imageMessage?.caption || m.videoMessage?.caption || '';
        const cap = caption ? `\n\n📝 ${caption}` : '';

        if (m.imageMessage) {
          await sock.sendMessage(ownerJid, { image: buffer, caption: `🖼️ *Deleted image*${cap}` });
        } else if (m.videoMessage) {
          await sock.sendMessage(ownerJid, { video: buffer, caption: `🎬 *Deleted video*${cap}` });
        } else if (m.audioMessage) {
          await sock.sendMessage(ownerJid, { audio: buffer, mimetype: 'audio/mp4' });
        } else if (m.stickerMessage) {
          await sock.sendMessage(ownerJid, { sticker: buffer });
        } else if (m.documentMessage) {
          await sock.sendMessage(ownerJid, {
            document: buffer,
            mimetype: m.documentMessage.mimetype,
            fileName: m.documentMessage.fileName,
          });
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log(`  ⚠️  Forward deleted: ${err.message}`);
  }
}

// ─── STATUS AUTO (read + react) ────────────
async function handleStatusAuto(msg) {
  if (!msg.key.participant) return;

  try {
    if (config.autoReadStatus) {
      await sock.readMessages([msg.key]);
    }

    if (config.autoLikeStatus) {
      const emoji = config.statusReacts[Math.floor(Math.random() * config.statusReacts.length)];
      try {
        await sock.sendMessage('status@broadcast', {
          react: { text: emoji, key: msg.key },
        }, { statusJidList: [msg.key.participant] });
      } catch (_) {}
    }
  } catch (err) {
    console.log(`  ⚠️  Status: ${err.message}`);
  }
}

function getSocket() { return sock; }

module.exports = { startBot, getSocket };
