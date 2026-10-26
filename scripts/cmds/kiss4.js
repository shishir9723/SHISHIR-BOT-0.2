const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "kiss4",
    aliases: ["kiss4"],
    version: "3.0",
    author: "ARIYAN",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss image",
    category: "love",
    guide: "{pn} @mention",
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);

    if (!mention[0]) {
      return message.reply("💋 Please mention someone");
    }

    const senderID = event.senderID;

    const mentionedID = mention[0];

    try {
      // Avatar URLs
      const avatar1 = `https://graph.facebook.com/${mentionedID}/picture?width=512&height=512`;

      const avatar2 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;

      // Load avatars
      const [avatarImg1, avatarImg2] = await Promise.all([
        Canvas.loadImage(avatar1),

        Canvas.loadImage(avatar2),
      ]);

      // Background
      const bg = await Canvas.loadImage("https://i.imgur.com/9K4G6Qx.jpeg");

      // Canvas
      const canvas = Canvas.createCanvas(850, 700);

      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, 850, 700);

      const avatarSize = 250;

      const y = 700 / 2 - avatarSize - 70;

      // Left avatar
      ctx.save();

      ctx.beginPath();

      ctx.arc(
        150 + avatarSize / 2,
        y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );

      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatarImg1, 150, y, avatarSize, avatarSize);

      ctx.restore();

      // Right avatar
      ctx.save();

      ctx.beginPath();

      ctx.arc(
        850 - 150 - avatarSize / 2,
        y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );

      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        avatarImg2,
        850 - 150 - avatarSize,
        y,
        avatarSize,
        avatarSize
      );

      ctx.restore();

      // Cache dir
      const cacheDir = path.join(__dirname, "tmp");

      await fs.ensureDir(cacheDir);

      // Unique file
      const imgPath = path.join(cacheDir, `kiss_${Date.now()}.png`);

      // Save
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      // Send
      return message.reply(
        {
          body: "💋 Kisssssss!",
          attachment: fs.createReadStream(imgPath),
        },

        () => {
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        }
      );
    } catch (err) {
      console.log(err);

      return message.reply(`❌ Error:\n${err.message}`);
    }
  },
};
