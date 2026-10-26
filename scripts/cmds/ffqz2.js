const axios = require("axios");

/* ===== Base API (same as before) ===== */
const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "ffqz2",
    aliases: ["ffquiz2", "freefire2", "freefireqz2"],
    version: "2.0",
    author: "ARIYAN AI", // ← তোমার নাম এখানে
    countDown: 10,
    role: 0,
    category: "game",
    guide: "{pn} [en/bn]",
  },

  /* ================= START ================= */
  onStart: async function ({ api, event, args }) {
    try {
      const input = args[0]?.toLowerCase() || "bn";
      const category =
        input === "en" || input === "english" ? "english" : "bangla";

      const apiUrl = await mahmud();
      const res = await axios.get(
        `${apiUrl}/api/freefire2?category=${category}`
      );

      const quiz = res.data?.data || res.data;

      if (!quiz || !quiz.question)
        return api.sendMessage(
          "❌ No quiz available.",
          event.threadID,
          event.messageID
        );

      const { question, correctAnswer, options } = quiz;
      const { a, b, c, d } = options;

      const msg = `╭──✦ ${question} ├‣ A) ${a} ├‣ B) ${b} ├‣ C) ${c} ├‣ D) ${d} ╰──────────────────‣ Reply with A / B / C / D ⏳ 40 seconds time.`;

      api.sendMessage(
        msg,
        event.threadID,
        (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: event.senderID,
            correctAnswer,
            messageID: info.messageID,
          });

          setTimeout(() => {
            api.unsendMessage(info.messageID);
            global.GoatBot.onReply.delete(info.messageID);
          }, 40000);
        },
        event.messageID
      );
    } catch (err) {
      console.log(err);
      api.sendMessage("❌ API Error.", event.threadID, event.messageID);
    }
  },

  /* ================= REPLY ================= */
  onReply: async function ({ event, api, Reply, usersData }) {
    if (event.senderID !== Reply.author)
      return api.sendMessage(
        "⚠️ This quiz is not yours.",
        event.threadID,
        event.messageID
      );

    await api.unsendMessage(Reply.messageID);

    const userReply = event.body.trim().toLowerCase();
    const correct = Reply.correctAnswer.toLowerCase();

    const userData = (await usersData.get(event.senderID)) || {};
    const money = userData.money || 0;
    const exp = userData.exp || 0;

    const rewardCoins = 500;
    const rewardExp = 121;

    if (userReply === correct || userReply === correct[0]) {
      await usersData.set(event.senderID, {
        money: money + rewardCoins,
        exp: exp + rewardExp,
      });

      return api.sendMessage(
        `✅ Correct Answer! 💰 +${rewardCoins} coins ⭐ +${rewardExp} exp`,
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `❌ Wrong Answer! Correct: ${Reply.correctAnswer}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
