// 📜 MENU — Royal Edition (LOCKED STYLE)

const { registerCommand, getCommandsByCategory } = require('../../lib/pluginLoader');
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

const ICONS = {
  general: '🗿',
  utility: '🔧',
  security: '🛡️',
  ai: '🤖',
  download: '📥',
  converter: '🎨',
  automation: '⚙️',
  search: '🔍',
  group: '👥',
  fun: '🎮',
  owner: '👑',
};

const ORDER = ['general', 'utility', 'security', 'ai', 'download', 'converter', 'automation', 'search', 'group', 'fun', 'owner'];

function formatCmds(cmds, prefix) {
  let result = '';
  const longCmd = cmds.some(c => c.name.length > 11);

  if (longCmd) {
    for (const c of cmds) result += `┃ ⌁ ${prefix}${c.name}\n`;
  } else {
    for (let i = 0; i < cmds.length; i += 2) {
      const left = `${prefix}${cmds[i].name}`.padEnd(13);
      const right = cmds[i + 1] ? `${prefix}${cmds[i + 1].name}` : '';
      result += `┃ ⌁ ${left}${right ? '⌁ ' + right : ''}\n`;
    }
  }
  return result;
}

registerCommand({
  name: 'menu',
  alias: ['help', 'list', 'commands'],
  category: 'general',
  description: 'Show all commands',
  execute: async (sock, msg, ctx) => {
    await ctx.react('📜');

    const grouped = getCommandsByCategory();
    const totalCmds = Object.values(grouped).reduce((acc, c) => acc + c.length, 0);
    const up = uptime(Date.now() - startTime);

    let menu = `╭━━━━━━━━━━━━━━━━╮
┃    *${config.botName}*
┃    *\`Royal Edition\`*
╰━━━━━━━━━━━━━━━━╯

┃ ❶ User     ➤ ${ctx.pushName}
┃ ❷ Owner    ➤ +${ctx.ownerNumber || 'Unknown'}
┃ ❸ Mode     ➤ ${config.mode.toUpperCase()}
┃ ❹ Prefix   ➤ ${config.prefix}
┃ ❺ Version  ➤ ${config.botVersion}
┃ ❻ Uptime   ➤ ${up}
┃ ❼ Commands ➤ ${totalCmds}
`;

    for (const cat of ORDER) {
      if (!grouped[cat] || !grouped[cat].length) continue;
      const icon = ICONS[cat] || '📂';
      menu += `\n╭━━━ ${icon} ${cat.toUpperCase()} ━━━╮\n`;
      menu += formatCmds(grouped[cat], config.prefix);
      menu += `╰━━━━━━━━━━━━━━━━╯\n`;
    }

    for (const [cat, cmds] of Object.entries(grouped)) {
      if (ORDER.includes(cat) || !cmds.length) continue;
      const icon = ICONS[cat] || '📂';
      menu += `\n╭━━━ ${icon} ${cat.toUpperCase()} ━━━╮\n`;
      menu += formatCmds(cmds, config.prefix);
      menu += `╰━━━━━━━━━━━━━━━━╯\n`;
    }

    menu += `\n> *${config.botFooter}*`;

    await ctx.send({
      image: { url: config.botPic },
      caption: menu,
      contextInfo: ctx.newsletterContext,
    });
  },
});
