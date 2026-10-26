const axios = require("axios"), { createCanvas, loadImage } = require("canvas"), fs = require("fs"), path = require("path");

module.exports = {
  config: {
    name: "shahabagi",
    aliases: ["shbg"],
    version: "1.0.5",
    author: "Mr.King 🎭",
    countDown: 5,
    role: 2,
    category: "troll",
    shortDescription: { en: "Shahabagi Frame" },
    guide: { en: "{pn} @mention | {pn} (reply)" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, mentions, messageReply } = event;

    const targetID = messageReply
      ? messageReply.senderID
      : Object.keys(mentions).length
      ? Object.keys(mentions)[0]
      : null;

    if (!targetID)
      return api.sendMessage("Mention or reply to a user.", threadID, messageID);

    try {
      api.setMessageReaction("🎭", messageID, () => {}, true);

      const bgRes = await axios.get(
        "https://i.ibb.co.com/DDS2KJ8B/image.png",
        { responseType: "arraybuffer" }
      );

      const avatarRes = await axios.get(
        `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );

      const background = await loadImage(Buffer.from(bgRes.data));
      const avatar = await loadImage(Buffer.from(avatarRes.data));

      const canvas = createCanvas(498, 552);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, 498, 552);

      const size = 95, x = 232, y = 205;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const output = path.join(cacheDir, `shbg_${targetID}.png`);
      const stream = fs.createWriteStream(output);

      canvas.createPNGStream().pipe(stream);

      stream.on("finish", () => {
        api.sendMessage(
          {
            attachment: fs.createReadStream(output)
          },
          threadID,
          () => {
            if (fs.existsSync(output))
              fs.unlinkSync(output);
          },
          messageID
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("Error!", threadID, messageID);
    }
  }
};
