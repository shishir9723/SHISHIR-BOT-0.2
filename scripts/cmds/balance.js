const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cacheDir = path.join(__dirname, "cache");

// ব্যালেন্স ফরম্যাট (1k, 1m, 1b, 1t)
function formatMoney(n) {
  if (n < 1e3) return n.toLocaleString();
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
  return +(n / 1e12).toFixed(1) + "T";
}

async function createBalanceCard(userData, userID, balance) {
  const width = 1000,
    height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ১. ডার্ক অ্যানিমে ব্যাকগ্রাউন্ড
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, height);

  // ২. নিয়ন গ্লোয়িং বর্ডার
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 12;
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#00ffcc";
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.shadowBlur = 0;

  // ৩. কার্ড টাইটেল ও চিপ ডিজাইন
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 45px Arial";
  ctx.fillText("AYMA [AI] BANK", 70, 100);

  // ৪. ব্যালেন্স ডিসপ্লে
  ctx.fillStyle = "#ffffff";
  ctx.font = "30px Arial";
  ctx.fillText("CURRENT BALANCE", 70, 220);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 100px Arial";
  ctx.fillText(`$${formatMoney(balance)}`, 70, 330);

  // ৫. ইউজার ইনফো
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 35px Arial";
  ctx.fillText(userData.name.toUpperCase(), 70, 450);
  ctx.font = "20px Courier New";
  ctx.fillText(`ACCOUNT NO: **** **** **** ${userID.slice(-4)}`, 70, 490);

  // ৬. গ্লোয়িং প্রোফাইল পিকচার
  const avtUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const response = await axios.get(avtUrl, { responseType: "arraybuffer" });
    const profilePic = await loadImage(Buffer.from(response.data));
    ctx.save();
    ctx.beginPath();
    ctx.arc(780, 275, 150, 0, Math.PI * 2);
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(profilePic, 630, 125, 300, 300);
    ctx.restore();
  } catch (e) {
    /* ডিফল্ট ব্যবহার করবে */
  }

  return canvas.toBuffer();
}

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "pay", "send"],
    version: "4.5", // বাগ ফিক্সড ভার্সন
    author: "ARIYAN AI",
    countDown: 5,
    role: 0,
    category: "Economy",
    description: "Anime Style Card with Transfer System",
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { threadID, messageID, senderID, mentions, messageReply, type } =
      event;

    // --- টাকা পাঠানোর লজিক (Mention or Reply) ---
    if (
      args[0] &&
      (type === "message_reply" || Object.keys(mentions).length > 0)
    ) {
      let receiverID =
        type === "message_reply"
          ? messageReply.senderID
          : Object.keys(mentions)[0];
      let amount = parseInt(args.find((a) => !isNaN(a)));

      // 🛑 সেলফ-ট্রান্সফার প্রোটেকশন চেক
      if (senderID.toString() === receiverID.toString()) {
        return api.sendMessage(
          "❌ আবাল নাকি জানু? নিজেকে নিজে টাকা পাঠাচ্ছো কেন! 😒🍼",
          threadID,
          messageID
        );
      }

      if (!amount || amount <= 0)
        return api.sendMessage(
          "❌ জানু, সঠিক টাকার পরিমাণ দাও!",
          threadID,
          messageID
        );

      const senderData = await usersData.get(senderID);
      const receiverData = await usersData.get(receiverID);

      if (senderData.money < amount)
        return api.sendMessage(
          "❌ তোমার কাছে এতো টাকা নেই জানু!",
          threadID,
          messageID
        );

      await usersData.set(senderID, { money: senderData.money - amount });
      await usersData.set(receiverID, {
        money: (receiverData.money || 0) + amount,
      });

      return api.sendMessage(
        `✅ সফলভাবে ${ receiverData.name }-কে $${amount.toLocaleString()} পাঠানো হয়েছে!`,
        threadID,
        messageID
      );
    }

    // --- কার্ড দেখানোর লজিক ---
    let targetID =
      type === "message_reply"
        ? messageReply.senderID
        : Object.keys(mentions).length > 0
        ? Object.keys(mentions)[0]
        : senderID;

    try {
      const userData = await usersData.get(targetID);
      const balance = userData.money || 0;
      const buffer = await createBalanceCard(userData, targetID, balance);
      const pathImg = path.join(cacheDir, `anya_bal_${targetID}.png`);

      await fs.ensureDir(cacheDir);
      fs.writeFileSync(pathImg, buffer);

      const msgText = `💳 𝐔𝐒𝐄𝐑 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐈𝐍𝐅𝐎\n\n👤 𝐍𝐚𝐦𝐞: ${ userData.name }\n🆔 𝐔𝐈𝐃: ${targetID}\n💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${formatMoney( balance )}\n📅 𝐕𝐚𝐥𝐢𝐝 𝐓𝐡𝐫𝐮: 𝟏𝟐/𝟐𝟔\n\n🏦 𝐀𝐧𝐲𝐚 [𝐀𝐈] 𝐁𝐚𝐧𝐤 🏦`;

      return api.sendMessage(
        {
          body: msgText,
          attachment: fs.createReadStream(pathImg),
        },
        threadID,
        () => fs.unlinkSync(pathImg),
        messageID
      );
    } catch (e) {
      api.sendMessage("❌ ব্যালেন্স কার্ড তৈরি করতে সমস্যা হয়েছে!", threadID);
    }
  },
};
