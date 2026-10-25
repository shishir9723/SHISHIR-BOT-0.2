const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");

// 👑 BOT INFORMATION
const AUTHOR = "SHISHIR Ahmed";
const BOT_NAME = "AYMA BOT";
const FOOTER = "𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃";

// 🔐 AUTHOR CHECK
function authorCheck() {
  if (AUTHOR !== "SHISHIR Ahmed") {
    throw new Error("AUTHOR CHANGED - FILE LOCKED");
  }
}

module.exports = {
  config: {
    name: "captain",
    version: "2.1.0",
    author: AUTHOR,
    countDown: 5,
    role: 0,
    shortDescription: "AYMA BOT Sad Video Sender 😢",
    longDescription:
      "Sends random sad videos with emotional captions 💔",
    category: "media",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      authorCheck();
    } catch (error) {
      return api.sendMessage(
        "❌ BOT LOCKED: AUTHOR CHANGED DETECTED!",
        event.threadID
      );
    }

    const captions = [
      `🐰🍒 শীত শীত ভাব কিসের জানি একটা অভাব! 🙊🙈

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `🦋🖤 ভালোবাসা সুন্দর,
যদি প্রিয় মানুষটি সঠিক হয়! ☺️🌸

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `❥ শূন্যতায় ভাসি 🙃
কখনো হাসি 😁💚 আবার কাঁদি 😅
বেলা শেষে শূন্যতায় জড়িয়ে
পূর্ণতা খুঁজি 😊❤️

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `💚 পৃথিবীটা আজ মিথ্যে মায়াতে ভরা! 🌺
তাই তো পৃথিবীর মানুষ আজ
অভিনয়ের সেরা! 🥀

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `💜🔐 সবাই তো খুশি চায়,
আর আমি প্রতিটা খুশিতে তোমাকে চাই! 🖤✨

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `🐰✨ চোখের দেখায় নয়,
মনের দেখায় ভালোবাসি! 😇🖤
কাছে থাকো কিংবা দূরে,
তোমাকে ভেবেই হাসি! 🦋🌸

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `💙🦋 মানুষ হচ্ছে বৃষ্টির মতো!
জীবনে অনেক মানুষ আসবে,
অনেক মানুষ চলে যাবে। 💔
সঠিক মানুষটা ঠিকই
ছায়া হয়ে পাশে থাকবে। 🌻

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `🐰🦋 𝙄 𝙖𝙢 𝘼𝙙𝙙𝙞𝙘𝙩𝙚𝙙 𝙏𝙤
𝙈𝙮 𝙁𝙖𝙫𝙤𝙧𝙞𝙩𝙚 𝙋𝙚𝙧𝙨𝙤𝙣! 💖🔐

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `🍒🖇️ পারফেক্ট কাউকে পাওয়ার থেকে
কাউকে পারফেক্ট বানিয়ে নিতে পারাটা
বড় অর্জন! 🌼💜

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`,

      `🌸✨ সঠিক মানুষ সব সময়ই রাগী হয়,
কারণ তারা অন্যের সঙ্গে
তোমাকে ভাগ করে নিতে চায় না! 🖤

✢━━━━━━━━━━━━━━━✢
𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 𝐀𝐇𝐌𝐄𝐃`
    ];

    // 🎬 VIDEO LINKS
    const links = [
      "https://drive.google.com/uc?id=1Z-6qll7ACq8Ka1pKpnC3guGcXU0gNvoL",
      "https://drive.google.com/uc?id=1YHm_oC7xItLokbt_MCWu-VdMGavvx-G4",
      "https://drive.google.com/uc?id=1YvDanPpMZKK4s547h9Bsf0uL719AvVEG",
      "https://drive.google.com/uc?id=1YemK-RQH3gUX_I9ThgNJLC89yPF-VtEY",
      "https://drive.google.com/uc?id=1YN25UGQQCpZvN29Y5a84ZCYlL-rc_JL_",
      "https://drive.google.com/uc?id=1YXbox7CyKc6Gu-56WAtAPlxSTs51Yo9n",
      "https://drive.google.com/uc?id=1YNVe1cEM0JM3lj7sU49tuJn4-8ASYVd8",
      "https://drive.google.com/uc?id=1ZDjeuPfIyUkovgmJCRsE7vE67aOe0Sp2",
      "https://drive.google.com/uc?id=1YcJciCtidcUxRGihUyx2uDgDg3cBYUE5",
      "https://drive.google.com/uc?id=1ZIE6xPwXg6_oxG0K7xCWKS04MNyag3QL",
      "https://drive.google.com/uc?id=1ZF9cOD_fj26rpWDf6WOjUQNz8QuRJhkv",
      "https://drive.google.com/uc?id=1ZAXQwA5BsnN555FrWii2bb-kdLaoMxLP",
      "https://drive.google.com/uc?id=1YvWRk-wQ_I8kuJzOuw2Mx7Q-Rrgbw6CT",
      "https://drive.google.com/uc?id=1Z8vKgEBUkKbwgMPvv_6K_lvVsrBca_X8",
      "https://drive.google.com/uc?id=1ZG-BJq7pP4oh93U6tHIKuYvZ8XiidlCV"
    ];

    const caption =
      captions[Math.floor(Math.random() * captions.length)];

    const link =
      links[Math.floor(Math.random() * links.length)];

    const cacheDir = path.join(__dirname, "cache");
    const cachePath = path.join(
      cacheDir,
      `ayma_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`
    );

    try {
      await fs.ensureDir(cacheDir);

      const response = await axios({
        url: link,
        method: "GET",
        responseType: "stream",
        timeout: 60000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const contentType =
        response.headers["content-type"] || "";

      if (
        contentType.includes("text/html") ||
        contentType.includes("application/json")
      ) {
        response.data.destroy();
        throw new Error(
          "Google Drive returned a webpage instead of a video."
        );
      }

      await pipeline(
        response.data,
        fs.createWriteStream(cachePath)
      );

      const stat = await fs.stat(cachePath);

      if (stat.size < 1024) {
        throw new Error("Invalid or empty video file.");
      }

      await api.sendMessage(
        {
          body:
            `╭━━━〔 💔 ${BOT_NAME} 💔 〕━━━╮\n\n` +
            `${caption}\n\n` +
            `╰━━━〔 ${FOOTER} 〕━━━╯`,
          attachment: fs.createReadStream(cachePath)
        },
        event.threadID
      );

    } catch (error) {
      console.error("[AYMA BOT CAPTAIN ERROR]", error);

      return api.sendMessage(
        "❌ AYMA BOT: ভিডিও পাঠানো যায়নি। ভিডিও লিংক বা ইন্টারনেট সংযোগ পরীক্ষা করো।",
        event.threadID
      );

    } finally {
      try {
        await fs.remove(cachePath);
      } catch (error) {
        console.error("Cache cleanup error:", error);
      }
    }
  }
};
