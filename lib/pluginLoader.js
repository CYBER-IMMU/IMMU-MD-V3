// 🔌 Plugin Loader

const fs = require('fs');
const path = require('path');

const commands = new Map();
const aliases = new Map();

function registerCommand(opts) {
  const { name, alias = [], category = 'general', description = '', execute } = opts;
  if (!name || typeof execute !== 'function') return;

  commands.set(name.toLowerCase(), {
    name: name.toLowerCase(),
    alias: alias.map(a => a.toLowerCase()),
    category,
    description,
    execute,
  });

  for (const a of alias) aliases.set(a.toLowerCase(), name.toLowerCase());
}

function getCommand(input) {
  const cmd = input.toLowerCase();
  if (commands.has(cmd)) return commands.get(cmd);
  if (aliases.has(cmd)) return commands.get(aliases.get(cmd));
  return null;
}

function getAllCommands() { return Array.from(commands.values()); }

function getCommandsByCategory() {
  const grouped = {};
  for (const cmd of commands.values()) {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  }
  return grouped;
}

function loadPlugins(pluginDir) {
  let count = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(full)];
          require(full);
          count++;
        } catch (err) {
          console.log(`  ❌ ${item}: ${err.message}`);
        }
      }
    }
  }
  walk(pluginDir);
  console.log(`  ✅ Loaded ${count} files (${commands.size} commands)`);
}

module.exports = { registerCommand, getCommand, getAllCommands, getCommandsByCategory, loadPlugins };
