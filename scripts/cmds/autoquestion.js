const INTERVAL_MS = 2 * 60 * 60 * 1000; // every 2 hours
const ANSWER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes to answer before auto-delete
const REWARD = 1000000; // $1M

let cachedApi = null;
const pendingQuestions = new Map(); // messageID -> { threadID, answer, timeoutHandle }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  const lang = Math.random() < 0.5 ? "en" : "bn";
  const opPick = ["add", "sub", "mul", "div"][randInt(0, 3)];

  let a, b, answer, opSymbol;

  if (opPick === "add") {
    a = randInt(10, 500);
    b = randInt(10, 500);
    answer = a + b;
    opSymbol = "+";
  } else if (opPick === "sub") {
    a = randInt(50, 900);
    b = randInt(1, a);
    answer = a - b;
    opSymbol = "-";
  } else if (opPick === "mul") {
    a = randInt(2, 30);
    b = randInt(2, 30);
    answer = a * b;
    opSymbol = "×";
  } else {
    b = randInt(2, 20);
    answer = randInt(2, 50);
    a = b * answer;
    opSymbol = "÷";
  }

  const text =
    lang === "en"
      ? `🧮 What is ${a} ${opSymbol} ${b}?`
      : `🧮 ${a} ${opSymbol} ${b} = কত?`;

  return { text, answer };
}

function buildBroadcastMsg(q) {
  return `🔔 𝗠𝗔𝗧𝗛 𝗖𝗛𝗔𝗟𝗟𝗘𝗡𝗚𝗘! ${q.text} 💰 First correct REPLY wins: $${REWARD.toLocaleString()} ↩️ Reply to THIS message with the number! ⏳ 10 minutes — unanswered questions self-delete.`;
}

function cleanupQuestion(messageID) {
  const pending = pendingQuestions.get(messageID);
  if (!pending) return;
  if (pending.timeoutHandle) clearTimeout(pending.timeoutHandle);
  pendingQuestions.delete(messageID);
  if (global.GoatBot?.onReply) global.GoatBot.onReply.delete(messageID);
}

function scheduleExpiry(messageID) {
  return setTimeout(async () => {
    const pending = pendingQuestions.get(messageID);
    if (!pending) return;
    cleanupQuestion(messageID);
    if (cachedApi) {
      try {
        await cachedApi.unsendMessage(messageID);
      } catch (err) {
        console.error(
          "AutoQuestion: failed to auto-delete expired question:",
          err.message
        );
      }
    }
  }, ANSWER_WINDOW_MS);
}

async function sendQuestionToThread(threadID) {
  if (!cachedApi) return;
  const q = generateQuestion();
  try {
    const info = await cachedApi.sendMessage(buildBroadcastMsg(q), threadID);
    if (!info || !info.messageID) return;

    global.GoatBot.onReply.set(info.messageID, {
      commandName: "autoquestion",
      messageID: info.messageID,
      answer: q.answer,
    });

    pendingQuestions.set(info.messageID, {
      threadID,
      answer: q.answer,
      timeoutHandle: scheduleExpiry(info.messageID),
    });
  } catch (err) {
    console.error(`AutoQuestion: failed to send to ${threadID}:`, err.message);
  }
}

function broadcastToAllThreads() {
  if (!cachedApi) return;
  const allThreads = (global.db && global.db.allThreadData) || [];
  for (const t of allThreads) {
    sendQuestionToThread(t.threadID);
  }
}

// Timer starts as soon as the module loads; it just waits for cachedApi
// to become available (set on the first message the bot sees).
setInterval(broadcastToAllThreads, INTERVAL_MS);

module.exports = {
  config: {
    name: "autoquestion",
    aliases: ["aq", "mathquiz"],
    version: "2.0.0",
    author: "𝑨𝑹𝑰𝒀𝑨𝑵",
    countDown: 3,
    role: 0,
    category: "Fun",
    description:
      "🔔 Auto-broadcasts a math question to every group every 2 hours",
    guide:
      "{pn} status - Show system info\n{pn} test - (admin) Force-send a question to this chat now",
  },

  onStart: async function ({ args, message, event, api }) {
    if (!cachedApi) cachedApi = api;

    const sub = args[0]?.toLowerCase();

    if (sub === "test") {
      const adminBotList = (global.GoatBot?.config?.adminBot || []).map(String);
      if (!adminBotList.includes(String(event.senderID))) {
        return message.reply(
          "❌ Only bot admins can force-send a test question."
        );
      }
      return sendQuestionToThread(event.threadID);
    }

    return message.reply(
      `🔔 Auto Math Question System ━━━━━━━━━━━━━━━━ • Runs every 2 hours in every active group • Reply to the question with the correct number — first correct reply wins $${REWARD.toLocaleString()} • Questions are randomly generated (English/Bangla mixed) — never repeat verbatim • Unanswered after 10 minutes → message auto-deletes`
    );
  },

  onReply: async function ({ event, api, Reply, usersData, message }) {
    if (!Reply || Reply.commandName !== "autoquestion") return;
    if (!cachedApi) cachedApi = api;

    const pending = pendingQuestions.get(Reply.messageID);
    if (!pending) return; // already answered or expired

    const submitted = parseInt(String(event.body || "").trim());
    if (isNaN(submitted) || submitted !== Reply.answer) return; // wrong guess, let others keep trying

    // Correct! First reply wins — clean up immediately so late replies can't also win.
    cleanupQuestion(Reply.messageID);

    const userData = (await usersData.get(event.senderID)) || {};
    const newBalance = (userData.money || 0) + REWARD;
    await usersData.set(event.senderID, { money: newBalance });

    let winnerName = "Someone";
    try {
      const info = await api.getUserInfo(event.senderID);
      winnerName = info?.[event.senderID]?.name || winnerName;
    } catch (err) {
      /* ignore */
    }

    return message.reply(
      `🎉 CORRECT! ${winnerName} got it first! ✅ Answer: ${Reply.answer} 💰 Won: $${REWARD.toLocaleString()} 💳 New Balance: $${newBalance.toLocaleString()}`
    );
  },
};
