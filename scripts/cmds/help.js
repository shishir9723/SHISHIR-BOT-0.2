const fs = require("fs-extra");
const path = require("path");
const https = require("https");

// --- Fonts ---
const smallCapsMap = {
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "ꜱ",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ",
};

const cmdFontMap = {
  ...smallCapsMap,
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
};

const toSmallCaps = (t) =>
  t
    .toLowerCase()
    .split("")
    .map((c) => smallCapsMap[c] || c)
    .join("");

const toCmdFont = (t) =>
  t
    .toLowerCase()
    .split("")
    .map((c) => cmdFontMap[c] || c)
    .join("");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "6.0",
    author: "𝐀𝐑𝐈𝐘𝐀𝐍",
    shortDescription: "Show all commands",
    longDescription: "Full command list with video",
    category: "system",
    guide: "{pn}help [command]",
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const categories = {};

    const cleanCategoryName = (text) => {
      if (!text) return "OTHERS";
      return text
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
    };

    // --- organize commands ---
    for (const [, cmd] of allCommands) {
      if (!cmd?.config || cmd.config.name === "help") continue;
      const cat = cleanCategoryName(cmd.config.category);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    // --- video list ---
    const videoURLs = [
      "https://i.imgur.com/IJOTdkf.mp4",
      "https://i.imgur.com/amKPt9x.mp4",
      "https://i.imgur.com/Aj0skDe.mp4",
      "https://i.imgur.com/2mRF8gL.mp4",
      "https://i.imgur.com/AMv8IqG.mp4",
      "https://i.imgur.com/mUpxBMI.mp4",
      "https://i.imgur.com/dhcx6pW.mp4",
      "https://i.imgur.com/SF4abeL.mp4",
      "https://i.imgur.com/qw9KVTY.mp4",
    ];

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const indexFile = path.join(cacheDir, "help_video_index.json");
    let index = 0;

    if (fs.existsSync(indexFile)) {
      try {
        index =
          (JSON.parse(fs.readFileSync(indexFile)).index + 1) % videoURLs.length;
      } catch {}
    }

    fs.writeFileSync(indexFile, JSON.stringify({ index }));

    const videoPath = path.join(cacheDir, `help_video_${index}.mp4`);
    if (!fs.existsSync(videoPath)) {
      await downloadFile(videoURLs[index], videoPath);
    }

    // --- single command ---
    if (args[0]) {
      const query = args[0].toLowerCase();

      const cmd =
        allCommands.get(query) ||
        [...allCommands.values()].find((c) =>
          (c.config?.aliases || []).map((a) => a.toLowerCase()).includes(query)
        );

      if (!cmd || !cmd.config) {
        return message.reply(`❌ Command "${query}" not found.`);
      }

      const {
        name,
        version,
        category,
        shortDescription,
        longDescription,
        aliases,
        guide,
      } = cmd.config;

      const desc =
        typeof longDescription === "string"
          ? longDescription
          : longDescription?.en ||
            shortDescription?.en ||
            shortDescription ||
            "No description";

      const usage = (
        typeof guide === "string" ? guide : guide?.en || `{pn}${name}`
      ).replace(/{pn}/g, prefix);

      return message.reply({
        body:
          `🌸 COMMAND INFO 🌸\n\n` +
          `🎀 Name: ${name}\n\n` +
          `🎀 Category: ${category || "None"}\n\n` +
          `🎀 Description: ${desc}\n\n` +
          `🎀 Aliases: ${aliases?.length ? aliases.join(", ") : "None"}\n\n` +
          `🎀 Usage: ${usage}\n\n` +
          `🎀 Author: SHISHIR\n\n` +
          `🎀 Version: ${version || "1.0"}`,
        attachment: fs.createReadStream(videoPath),
      });
    }

    // --- full menu ---
    let msg =
      "┍━━━━━━━━━━━━━━━𒐬\n┋ 𓊈🍓 SHISHIR BOT CMDS 🍓𓊉\n┕━━━━━━━━━━━━━━━𒐬\n\n\n";

    const sortedCategories = Object.keys(categories).sort();

    for (const cat of sortedCategories) {
      msg += `╭━━━𓊈 🍁 ${toSmallCaps(cat)} 𓊉\n`;
      const commands = categories[cat].sort();

      for (let i = 0; i < commands.length; i += 2) {
        const a = toCmdFont(commands[i]);
        const b = commands[i + 1] ? toCmdFont(commands[i + 1]) : null;
        msg += b ? `┋⌬ ${a} ⌬ ${b}\n` : `┋⌬ ${a}\n`;
      }

      msg += `┕━━━━━━━━━━━━𒐬\n\n`;
    }

    msg +=
      `┍━━━━━━━━━━━━━━━𒐬\n` +
      ` 𓊈🎀𓊉 Total Commands: ${allCommands.size - 1}\n` +
      ` 𓊈🔑𓊉 Prefix: ${prefix}\n` +
      ` 𓊈👑𓊉 Owner: SHISHIR\n` +
      `┕━━━━━━━━━━━━━━━𒐬`;

    return message.reply({
      body: msg,
      attachment: fs.createReadStream(videoPath),
    });
  },
};

// --- downloader ---
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          fs.unlink(dest, () => {});
          return reject();
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
         }
