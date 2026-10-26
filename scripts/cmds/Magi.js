const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

async function getProfilePicture(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    return await loadImage(url);
  } catch {
    return null;
  }
}

module.exports = {
  config: {
    name: "magi",
    version: "2.2.0",
    author: "Ashik + ARIYAN 🌚+ Ri'du fixed ",
    role: 0,
    shortDescription: "Magic Love Pair",
    category: "fun",
    guide: "{pn} @mention / reply",
  },

  onStart: async function ({ event, api }) {
    try {
      const senderID = event.senderID;

      // ✅ Detect mention or reply
      let targetID;

      if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }

      if (!targetID) {
        return api.sendMessage(
          "❌ | Please mention or reply to someone!",
          event.threadID
        );
      }

      const senderName = event.senderName || "User";
      const targetName =
        event.mentions?.[targetID]?.replace("@", "") || "Partner";

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const BASE_IMAGE_URL = "https://i.postimg.cc/tRhnk0rd/bad-teacher.jpg";
      const baseImagePath = path.join(cacheDir, "magi_base.jpg");

      if (!fs.existsSync(baseImagePath)) {
        const img = await axios.get(BASE_IMAGE_URL, {
          responseType: "arraybuffer",
        });
        fs.writeFileSync(baseImagePath, img.data);
      }

      const canvas = createCanvas(900, 600);
      const ctx = canvas.getContext("2d");

      const baseImg = await loadImage(baseImagePath);
      const userImg = await getProfilePicture(senderID);
      const targetImg = await getProfilePicture(targetID);

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // 👤 User face
      if (userImg) {
        const x = 310,
          y = 115,
          size = 110;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(userImg, x, y, size, size);
        ctx.restore();
      }

      // 👤 Target face
      if (targetImg) {
        const x = 445,
          y = 190,
          size = 110;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(targetImg, x, y, size, size);
        ctx.restore();
      }

      const outPath = path.join(cacheDir, `magi_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      // 💬 Professional Message
      const message = `💖 𝗠𝗔𝗚𝗜 𝗠𝗔𝗧𝗖𝗛 💖 ━━━━━━━━━━━━━━━━━━ 👤 ${senderName} 💞 ${targetName} ━━━━━━━━━━━━━━━━━━ ✨ Compatibility: 100% 🔥 Chemistry: Maximum 😈 Mood: Intense ━━━━━━━━━━━━━━━━━━ 💌 Perfect Match Detected!`;

      api.sendMessage(
        {
          body: message,
          attachment: fs.createReadStream(outPath),
        },
        event.threadID,
        () => fs.unlink(outPath).catch(() => {})
      );
    } catch (err) {
      console.error("MAGI ERROR:", err);
      api.sendMessage(
        "❌ | Something went wrong while processing your request.",
        event.threadID
      );
    }
  },
};
