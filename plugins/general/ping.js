// ⚡ PING

const { registerCommand } = require('../../lib/pluginLoader');

registerCommand({
  name: 'ping',
  alias: ['p', 'speed'],
  category: 'general',
  description: 'Bot speed test',
  execute: async (sock, msg, ctx) => {
    const start = Date.now();
    await ctx.react('⚡');
    const ms = Date.now() - start;

    await ctx.reply(`╭━━〔 *⚡ PING* 〕━━╮
┃
┃ Response : *${ms}ms*
┃ Status   : *Active*
┃
╰━━━━━━━━━━━━━━━━╯

> *${ctx.botFooter}*`);
  },
});
