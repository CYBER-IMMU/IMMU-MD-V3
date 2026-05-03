// 💾 Message Store for Anti-Delete

const NodeCache = require('node-cache');

const messageCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

function saveMessage(msg) {
  if (!msg?.key?.id) return;
  messageCache.set(msg.key.id, msg);
}

function getMessage(id) {
  return messageCache.get(id);
}

module.exports = { saveMessage, getMessage, messageCache };
