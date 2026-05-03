// ╔══════════════════════════════════════════╗
// ║     IMMU MD V3 — Royal Edition           ║
// ╚══════════════════════════════════════════╝

require('dotenv').config();

module.exports = {
  // ─── Identity ──────────────────────────────
  botName: process.env.BOT_NAME || "IMMU MD V3",
  botVersion: "3.0.0",

  // ─── Branding ──────────────────────────────
  botPic: process.env.BOT_PIC || "https://i.ibb.co/p6frQZNZ/Picsart-26-04-27-12-36-40-582.jpg",
  botFooter: "Powered by IMMU MD V3",

  // ─── Channel & Group (Auto-follow on first connect) ───
  newsletterJid: "120363341506278064@newsletter",
  newsletterName: "𝐈ᴍᴍυ 𝐌ᴅ",
  newsletterUrl: "https://whatsapp.com/channel/0029Vaq4PRsD38CJKXzwmb42",

  // Auto-follow these channels on first connect
  autoFollowChannels: [
    "120363341506278064@newsletter",
  ],

  // Auto-join these groups on first connect (invite codes)
  autoJoinGroups: [
    "JQTH0GwURpjIJEzhpcFosO",
  ],

  // ─── Bot Settings ──────────────────────────
  prefix: process.env.PREFIX || ".",
  mode: process.env.MODE || "public",
  timezone: process.env.TIME_ZONE || "Asia/Karachi",
  port: parseInt(process.env.PORT) || 8000,

  // ─── Authentication ────────────────────────
  sessionId: process.env.SESSION_ID || "",
  usePairCode: process.env.USE_PAIR_CODE !== "false",

  // ─── Auto Features (always on for Heroku) ─
  alwaysOnline: true,
  autoReadStatus: process.env.AUTO_READ_STATUS !== "false",
  autoLikeStatus: process.env.AUTO_LIKE_STATUS !== "false",

  // Status reactions (as user requested)
  statusReacts: ['🚩', '❤️', '✅', '⚠️'],

  // ─── Anti Features ─────────────────────────
  antiDelete: process.env.ANTIDELETE !== "false", // ON by default
  antiViewOnce: process.env.ANTIVIEWONCE !== "false", // ON by default
  antiCall: process.env.ANTICALL === "true",
};
