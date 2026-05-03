// 💚 ALIVE

const { registerCommand } = require('../../lib/pluginLoader');
const config = require('../../config');
const moment = require('moment-timezone');

const startTime = Date.now();

function uptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

registerCommand({
  name: 'alive',
  alias: ['runtime', 'uptime', 'status'],
  category: 'general',
  description: 'Bot status',
  execute: async (sock, msg, ctx) => {
    await ctx.react('💚');

    const time = moment().tz(config.timezone).format('HH:mm:ss');
    const date = moment().tz(config.timezone).format('DD MMM YYYY');

    const caption = `╭━━━━━━━━━━━━━━━━╮
┃    *${config.botName}*
┃    *\`Royal Edition\`*
╰━━━━━━━━━━━━━━━━╯

┃ ❶ Status   ➤ *Online* ✅
┃ ❷ Uptime   ➤ ${uptime(Date.now() - startTime)}
┃ ❸ Version  ➤ ${config.botVersion}
┃ ❹ Mode     ➤ ${config.mode.toUpperCase()}
┃ ❺ Prefix   ➤ ${config.prefix}
┃ ❻ Time     ➤ ${time}
┃ ❼ Date     ➤ ${date}

> *${config.botFooter}*`;

    await ctx.send({
      image: { url: config.botPic },
      caption,
      contextInfo: ctx.newsletterContext,
    });
  },
});
