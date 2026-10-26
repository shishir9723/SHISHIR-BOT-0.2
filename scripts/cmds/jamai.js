const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jamai",
    aliases: ["hubby"],
    version: "0.0.8",
    author: "ariyan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "random jamai" },
    longDescription: { en: "Random Jamai from group" },
    category: "fun",
    guide: "{pn}",
  },

  onStart: async ({ api, event, usersData }) => {
    const { threadID, messageID } = event;

    try {
      const info = await api.getThreadInfo(threadID);

      const maleOnly = info.userInfo.filter((user) => {
        const g = user.gender;
        if (!g) return false;
        if (typeof g === "number") return g % 2 === 0;
        if (typeof g === "string")
          return g.trim().charAt(0).toLowerCase() === "m";
        if (g && g.isMale === true) return true;
        return false;
      });

      if (!maleOnly.length) {
        return api.sendMessage(
          "🎩 𝐍𝐨 𝐦𝐚𝐥𝐞 𝐮𝐬𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩!",
          threadID,
          messageID
        );
      }

      const pick = maleOnly[Math.floor(Math.random() * maleOnly.length)];
      const uid = pick.id;

      let avatar = await usersData.getAvatarUrl(uid);
      if (!avatar)
        avatar = `https://graph.facebook.com/${uid}/picture?width=600`;

      const folder = path.join(__dirname, "cache");
      await fs.ensureDir(folder);

      const imgPath = path.join(folder, `${uid}.jpg`);
      const img = await axios.get(avatar, { responseType: "arraybuffer" });
      await fs.writeFile(imgPath, img.data);

      const infoUser = await api.getUserInfo(uid);
      const name = infoUser[uid]?.name || "𝐔𝐧𝐤𝐧𝐨𝐰𝐧";
      const link = `https://facebook.com/${uid}`;

      const msg = `🎩 𝐘𝐎𝐔𝐑 𝐇𝐔𝐒𝐁𝐀𝐍𝐃 𝐈𝐒 𝐇𝐄𝐑𝐄! 🎩 🎩 𝐍𝐚𝐦𝐞: ${name} 🆔 𝐔𝐈𝐃: ${uid} 🌐 𝐏𝐫𝐨𝐟𝐢𝐥𝐞: ${link} 🎩 𝐓𝐫𝐞𝐚𝐭 𝐡𝐢𝐦 𝐰𝐞𝐥𝐥! 🎩`;

      api.sendMessage(
        { body: msg, attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath)
      );
    } catch (err) {
      api.sendMessage("🎩 𝐄𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝!", threadID, messageID);
    }
  },
};
