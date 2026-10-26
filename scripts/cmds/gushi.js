const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "gushi",
    aliases: ["punch"],
    version: "2.0",
    author: "Converted by ariyan",
    countDown: 5,
    role: 0,
    shortDescription: "🥊 Punch someone",
    longDescription: "Tag or reply to someone to generate a punch image",
    category: "fun",
    guide: "{pn} @tag or reply",
  },

  onStart: async function ({ event, message, usersData }) {
    const { senderID, mentions, messageReply } = event;

    const puncherID = senderID;
    let targetID = Object.keys(mentions || {})[0];

    if (!targetID && messageReply?.senderID) {
      targetID = messageReply.senderID;
    }

    if (!targetID) {
      return message.reply(
        "🥊 | Please tag someone or reply to their message."
      );
    }

    try {
      // Get names
      const puncherName = await usersData
        .getName(puncherID)
        .catch(() => "Someone");
      const targetName = await usersData
        .getName(targetID)
        .catch(() => "Someone");

      // Get avatars
      const puncherAvatarUrl = await usersData.getAvatarUrl(puncherID);
      const targetAvatarUrl = await usersData.getAvatarUrl(targetID);

      // Load images
      const [puncherAvatar, targetAvatar, baseImage] = await Promise.all([
        loadImage(puncherAvatarUrl),
        loadImage(targetAvatarUrl),
        loadImage(
          "https://raw.githubusercontent.com/X-nil143/XGbal/refs/heads/main/Messenger_creation_25995716493353919.jpeg"
        ),
      ]);

      // Create canvas
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);

      // Function to draw circle avatar
      function drawCircleAvatar(avatar, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      }

      // Avatar positions
      drawCircleAvatar(puncherAvatar, 1000, 50, 338);
      drawCircleAvatar(targetAvatar, 80, 572, 338);

      // Save temp file
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const filePath = path.join(tmpDir, `punch_${puncherID}_${targetID}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `🥊 ${puncherName} just punched ${targetName}! 😆`,
        attachment: fs.createReadStream(filePath),
      });

      // Auto delete
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5000);
    } catch (err) {
      console.error("Punch command error:", err);
      return message.reply(
        "❌ | Couldn't generate punch image. Try again later."
      );
    }
  },
};
