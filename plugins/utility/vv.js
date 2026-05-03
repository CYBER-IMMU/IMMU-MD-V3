// 👁️ VIEW-ONCE RECOVERY (.vv command)

const { registerCommand } = require('../../lib/pluginLoader');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

registerCommand({
  name: 'vv',
  alias: ['viewonce', 'reveal'],
  category: 'utility',
  description: 'Reveal view-once media (sends to your DM)',
  execute: async (sock, msg, ctx) => {
    const quoted = ctx.quoted;
    if (!quoted) {
      return ctx.reply(`╭━━〔 *👁️ VIEW-ONCE* 〕━━╮
┃
┃ Reply to a view-once message:
┃ ⌁ ${ctx.botPrefix}vv
┃
╰━━━━━━━━━━━━━━━━━━━╯`);
    }

    await ctx.react('👁️');

    try {
      // Detect view-once
      const viewOnce = quoted.viewOnceMessage?.message
                    || quoted.viewOnceMessageV2?.message
                    || quoted.viewOnceMessageV2Extension?.message;

      // If quoted itself IS the inner media (already a view-once unwrapped)
      const target = viewOnce || quoted;

      const mediaType = target.imageMessage ? 'image'
                     : target.videoMessage ? 'video'
                     : null;

      if (!mediaType) {
        return ctx.reply('💀 _Not a view-once media._');
      }

      // Download
      const buffer = await ctx.downloadMedia({ message: target });
      if (!buffer) return ctx.reply('💀 _Download failed._');

      const caption = target[mediaType + 'Message']?.caption || '';
      const myNumber = ctx.myNumber || sock.user?.id?.split(':')[0]?.split('@')[0];
      const ownerJid = jidNormalizedUser(myNumber + '@s.whatsapp.net');

      const cap = `╭━━〔 *👁️ VIEW-ONCE REVEALED* 〕━━╮
┃ 🕐 ${new Date().toLocaleString()}
╰━━━━━━━━━━━━━━━━━━━━━━━╯${caption ? '\n\n📝 ' + caption : ''}`;

      // Send to OWNER's DM (own number)
      await sock.sendMessage(ownerJid, { [mediaType]: buffer, caption: cap });

      // Confirm in chat
      await ctx.reply('✅ _Sent to your DM._');
    } catch (err) {
      await ctx.reply(`💀 *Error:* ${err.message}`);
    }
  },
});
