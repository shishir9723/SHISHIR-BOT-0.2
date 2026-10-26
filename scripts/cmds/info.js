const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "info",
    version: "2.4.70",
    author: "ST | Sheikh Tamim",
    countDown: 20,
    role: 0,
    shortDescription: "Owner information command",
    longDescription:
      "This command provides detailed info about the bot owner, uptime, and social contacts.",
    category: "owner",
    guide: {},
  },

  onStart: async function ({ message }) {
    const authorName = " AYMA | SHISHIR  ";
    const ownAge = "⫷ 2 Years Old ⫸";
    const messenger = "https://m.me/61595106187744";
    const authorFB = "Facebook.com";
    const authorNumber = "+88017XXXXXXX";
    const Status = "⫷ 💫 Keep Calm & Code On 💫 ⫸";

    const urls = ["https://i.imgur.com/Boccigo.jpeg"];

    const link = urls[Math.floor(Math.random() * urls.length)];

    const now = moment().tz("Asia/Dhaka");

    const date = now.format("MMMM Do YYYY");
    const time = now.format("h:mm:ss A");

    const uptime = process.uptime();

    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    return message.reply({
      body: ` ╔═《✨ 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 ✨》═╗ ⭓ 🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲 : 『 ${global.GoatBot.config.nickNameBot} 』 ⭓ ☄️ 𝗣𝗿𝗲𝗳𝗶𝘅 : 『 ${global.GoatBot.config.prefix} 』 ⭓ ⚡ 𝗨𝗽𝘁𝗶𝗺𝗲 : 『 ${uptimeString} 』 ⭓ 🗓️ 𝗗𝗮𝘁𝗲 : 『 ${date} 』 ⭓ ⏰ 𝗧𝗶𝗺𝗲 : 『 ${time} 』 ⭓ ✉️ 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 : 『 ${messenger} 』 ⭓ 👑 𝗢𝘄𝗻𝗲𝗿 : 『 ${authorName} 』 ⭓ 🎂 𝗔𝗴𝗲 : 『 ${ownAge} 』 ⭓ ❤️ 𝗦𝘁𝗮𝘁𝘂𝘀 : 『 ${Status} 』 ⭓ 📱 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 : 『 ${authorNumber} 』 ⭓ 🌐 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 : 『 ${authorFB} 』 ╔═《🌍 𝗦𝗢𝗖𝗜𝗔𝗟𝗦》═╗ • 📺 YouTube : ❝ nai ❞ • ✈️ Telegram : t.me/shishir4567• 📷 Instagram : nai • 🧿 CapCut : ❝ nai ❞ • 🎵 TikTok : ❝ nai ❞ ╚════════════════════╝`,

      attachment: await global.utils.getStreamFromURL(link),
    });
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.toLowerCase().trim() === "info") {
      return this.onStart({ message });
    }
  },
};
