// 💾 SAVE STATUS

const { registerCommand } = require('../../lib/pluginLoader');

registerCommand({
  name: 'save',
  alias: ['savestatus', 'sv'],
  category: 'utility',
  description: 'Save status by replying',
  execute: async (sock, msg, ctx) => {
    const quoted = ctx.quoted;
    if (!quoted) {
      return ctx.reply(`╭━━〔 *💾 SAVE* 〕━━╮
┃
┃ Reply to a status with:
┃ ⌁ ${ctx.botPrefix}save
┃
╰━━━━━━━━━━━━━━━━╯`);
    }

    await ctx.react('💾');

    try {
      const m = quoted;
      const mediaType = m.imageMessage ? 'image'
                     : m.videoMessage ? 'video'
                     : m.audioMessage ? 'audio'
                     : null;

      if (mediaType) {
        const buffer = await ctx.downloadMedia({ message: quoted });
        if (!buffer) return ctx.reply('💀 _Download failed._');

        const caption = m[mediaType + 'Message']?.caption || '';
        const cap = caption ? `${caption}\n\n💾 _Saved_` : '💾 _Saved_';

        if (mediaType === 'audio') {
          await ctx.send({ audio: buffer, mimetype: 'audio/mp4' });
        } else {
          await ctx.send({ [mediaType]: buffer, caption: cap });
        }
      } else if (m.conversation || m.extendedTextMessage?.text) {
        const text = m.conversation || m.extendedTextMessage.text;
        await ctx.reply(`💾 *Status saved:*\n\n${text}`);
      } else {
        await ctx.reply('💀 _Cannot save this type._');
      }
    } catch (err) {
      await ctx.reply(`💀 *Error:* ${err.message}`);
    }
  },
});
