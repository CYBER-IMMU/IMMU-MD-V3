// 🛠️ Helpers

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');

const logger = pino({ level: 'silent' });

function getMessageContent(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  );
}

function getQuotedMessage(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

function getQuotedKey(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.stanzaId) return null;
  return {
    remoteJid: ctx.remoteJid || msg.key.remoteJid,
    id: ctx.stanzaId,
    participant: ctx.participant,
    fromMe: false,
  };
}

async function downloadMedia(msgOrQuoted) {
  try {
    return await downloadMediaMessage(msgOrQuoted, 'buffer', {}, { logger });
  } catch (err) {
    return null;
  }
}

function forwardedContext(config) {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.newsletterJid,
      newsletterName: config.newsletterName,
      serverMessageId: 143,
    },
  };
}

module.exports = {
  getMessageContent,
  getQuotedMessage,
  getQuotedKey,
  downloadMedia,
  forwardedContext,
};
