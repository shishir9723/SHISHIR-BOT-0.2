const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Function to check if the author matches
async function checkAuthor(authorName) {
  try {
    const response = await axios.get("https://author-check.vercel.app/name");
    const apiAuthor = response.data.name;
    return apiAuthor === authorName;
  } catch (error) {
    console.error("Error checking author:", error);
    return false;
  }
}

module.exports = {
  config: {
    name: "uff2",
    aliases: [],
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 2,
    shortDescription: "18+ tiktok video",
    longDescription: "18+ tiktok video",
    category: "18+",
    guide: "{p}onlytik",
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    // ==========================================
    // ЁЯСС VIP CHECK LOGIC
    // ==========================================
    const uid = event.senderID;
    const userData = await usersData.get(uid);

    const vipExpires = Number(userData?.data?.vip?.expires || 0);

    // Permanent VIP рж╣рж▓рзЗ expires = 0
    const isPermanentVIP = userData?.data?.vip?.expires === 0;

    // Temporary VIP рж╣рж▓рзЗ expiry ржПржЦржирзЛ рж╢рзЗрж╖ рж╣рзЯржирж┐
    const isTempVIP = vipExpires > Date.now();

    if (!isPermanentVIP && !isTempVIP) {
      return message.reply(
        "рждрзБржЗ ржЧрж░рж┐ржм ЁЯжЖ " +
          "ржЧрж░рж┐ржм ржорж╛ржирзБрж╖ ржПржЧрзБрж▓рзЛ ржмрзНржпржмрж╣рж╛рж░ ржХрж░рждрзЗ ржкрж╛рж░рзЗ ржирж╛" +
          " ржзржирзЗрж░ ржорж╛рж▓рж┐ржХ рж╣рждрзЗ ржЪрж╛ржЗрж▓рзЗ ржЯрж╛ржЗржк /VIP"
      );
    }
    // ==========================================

    const isAuthorValid = await checkAuthor(module.exports.config.author);
    if (!isAuthorValid) {
      await message.reply(
        "Author changer alert! This command belongs to Vex_Kshitiz."
      );
      return;
    }

    const apiUrl = "https://only-tik.vercel.app/kshitiz";

    try {
      const response = await axios.get(apiUrl);
      const { videoUrl, likes } = response.data;

      const tempVideoPath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempVideoPath);
      const videoResponse = await axios.get(videoUrl, {
        responseType: "stream",
      });
      videoResponse.data.pipe(writer);

      writer.on("finish", () => {
        const stream = fs.createReadStream(tempVideoPath);

        message.reply({
          body: `ржПржЧрзБрж▓рзЛ ржжрзЗржЦрж╛рж░ ржмрзЯрж╕ рж╣рзЯ ржирж╛ржЗ рж▓рзБржЪрзНржЪрж╛ ржХрзЛржерж╛ржХрж╛рж░ЁЯЧ┐`,
          attachment: stream,
        });
      });
    } catch (error) {
      console.error("Error fetching OnlyTik video:", error);
      message.reply("Sorry, an error occurred while processing your request.");
    }
  },
};
