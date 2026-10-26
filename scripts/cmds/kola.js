const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "kola",
    version: "3.0",
    author: "ARIYAN",
    countDown: 5,
    role: 0,
    category: "fun",
    description: "Funny kola edit",
    guide: "{pn} @mention",
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID, mentions, messageReply } = event;

    let targetID;
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (messageReply) {
      targetID = messageReply.senderID;
    } else {
      targetID = event.senderID;
    }

    try {
      const userInfo = await api.getUserInfo(targetID);
      const userName = userInfo[targetID]?.name || "User";

      const imgLink = "https://i.imgur.com/iNV52mX.jpeg";
      const filePath = path.join(__dirname, "cache_kola.png");

      const accessToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const targetPfpUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${accessToken}`;

      const [baseImage, targetPfp] = await Promise.all([
        loadImage(imgLink),
        loadImage(targetPfpUrl),
      ]);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0);

      ctx.beginPath();
      ctx.arc(300, 200, 70, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(targetPfp, 230, 130, 140, 140);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      return api.sendMessage(
        {
          body: `ðŸ˜‚ à¦•à¦²à¦¾ à¦–à¦¾à¦‡à¦¤à§‡à¦›à§‡: ${userName}`,
          mentions: [{ tag: userName, id: targetID }],
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );
    } catch (e) {
      return message.reply("Error ðŸ˜’");
    }
  },
};
