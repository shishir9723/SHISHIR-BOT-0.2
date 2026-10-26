const axios = require("axios");

module.exports = {
  config: {
    name: "edit2",
    version: "0.0.7",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    shortDescription: "Edit image",
    longDescription: "Reply to any image",
    category: "image",
    guide: "{pn} [text]",
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
          "ржЧрж░рж┐ржм ржорж╛ржирзБрж╖ ржПржЧрзБрж▓рзЛ ржмрзНржпржмрж╣рж╛рж░ ржХрж░рждрзЗ ржкрж╛рж░рзЗ ржирж╛ " +
          "ржзржирзЗрж░ ржорж╛рж▓рж┐ржХ рж╣рждрзЗ ржЪрж╛ржЗрж▓рзЗ ржЯрж╛ржЗржк /VIP"
      );
    }
    // ==========================================
    const react = (emoji) =>
      api.setMessageReaction(emoji, event.messageID, () => {}, true);

    try {
      const prompt = args.join(" ");

      if (!prompt) {
        react("тЪая╕П");
        return api.sendMessage("тЪая╕П | Please provide text.", event.threadID);
      }

      const imageUrl = event.messageReply?.attachments[0]?.url;

      if (!imageUrl) {
        react("ЁЯЦ╝я╕П");
        return api.sendMessage(
          "ЁЯЦ╝я╕П | Please reply to an image.",
          event.threadID
        );
      }

      react("тП│");

      const apiUrl = `https://azadx69x.is-a.dev/api/editor?url=${encodeURIComponent( imageUrl )}&prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(apiUrl, { responseType: "stream" });

      react("тЬЕ");

      api.sendMessage(
        {
          body: `тЬЕ Image edited successfully!\nЁЯУЭ Prompt: ${prompt}`,
          attachment: response.data,
        },
        event.threadID
      );
    } catch (error) {
      console.error(error);
      react("тЭМ");
      api.sendMessage("тЭМ | Failed to process image.", event.threadID);
    }
  },
};
