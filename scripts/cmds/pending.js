"use strict";

module.exports = {
  config: {
    name: "pending",
    version: "3.0.0",
    author: "𝑺𝑯𝑰𝑺𝑯𝑰𝑹",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "𝑷𝒆𝒏𝒅𝒊𝒏𝒈 𝑮𝒓𝒐𝒖𝒑 𝑴𝒂𝒏𝒂𝒈𝒆𝒓"
    },
    longDescription: {
      en: "𝑨𝒑𝒑𝒓𝒐𝒗𝒆 𝒐𝒓 𝑹𝒆𝒋𝒆𝒄𝒕 𝑷𝒆𝒏𝒅𝒊𝒏𝒈 𝑮𝒓𝒐𝒖𝒑𝒔"
    },
    category: "Admin"
  },

  langs: {
    en: {
      invalidNumber: "❌ 𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑵𝒖𝒎𝒃𝒆𝒓: %1",
      cancelSuccess: "╰┈➤ ❌ 𝑹𝒆𝒋𝒆𝒄𝒕𝒆𝒅 %1 𝑮𝒓𝒐𝒖𝒑(𝒔)!",
      approveSuccess: "╰┈➤ ✅ 𝑨𝒑𝒑𝒓𝒐𝒗𝒆𝒅 %1 𝑮𝒓𝒐𝒖𝒑(𝒔)!",
      cantGetPendingList: "❌ 𝑭𝒂𝒊𝒍𝒆𝒅 𝑻𝒐 𝑮𝒆𝒕 𝑷𝒆𝒏𝒅𝒊𝒏𝒈 𝑳𝒊𝒔𝒕!",
      returnListClean:
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 𓆩 🖤 𓆪 𝑺𝑯𝑰𝑺𝑯𝑰𝑹 𝑩𝑶𝑻\n" +
        "┃\n" +
        "┃ ✅ 𝑵𝒐 𝑷𝒆𝒏𝒅𝒊𝒏𝒈 𝑮𝒓𝒐𝒖𝒑𝒔!\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
    }
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];

      const list = [...spam, ...pending].filter(
        (group, index, self) =>
          group.isSubscribed &&
          group.isGroup &&
          index === self.findIndex(
            g => g.threadID === group.threadID
          )
      );

      if (!list.length) {
        return api.sendMessage(
          getLang("returnListClean"),
          threadID,
          messageID
        );
      }

      let msg =
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 𓆩 🖤 𓆪 𝑺𝑯𝑰𝑺𝑯𝑰𝑹 𝑩𝑶𝑻
┃
┃ ⏳ 𝑷𝑬𝑵𝑫𝑰𝑵𝑮 𝑮𝑹𝑶𝑼𝑷𝑺
┃ 📊 𝑻𝒐𝒕𝒂𝒍: ${list.length}
╰━━━━━━━━━━━━━━━━━━━━╯

`;

      list.forEach((item, index) => {
        msg +=
`╭───「 ${index + 1} 」───
┃ 🏷️ 𝑵𝒂𝒎𝒆: ${item.name || "𝑼𝒏𝒏𝒂𝒎𝒆𝒅"}
┃ 🆔 𝑰𝑫: ${item.threadID}
╰━━━━━━━━━━━━━━━━━━━━╯

`;
      });

      msg +=
`💡 𝑹𝒆𝒑𝒍𝒚 𝑾𝒊𝒕𝒉 𝑵𝒖𝒎𝒃𝒆𝒓 𝑻𝒐 𝑨𝒑𝒑𝒓𝒐𝒗𝒆
❌ 𝑼𝒔𝒆: c1 c2 𝑻𝒐 𝑹𝒆𝒋𝒆𝒄𝒕`;

      return api.sendMessage(
        msg,
        threadID,
        (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );

    } catch (error) {
      console.error("[PENDING ERROR]", error);
      return api.sendMessage(
        getLang("cantGetPendingList"),
        threadID,
        messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (String(event.senderID) !== String(Reply.author)) return;

    const { threadID, messageID } = event;
    const body = String(event.body || "").trim();

    if (!body) return;

    const isCancel = /^(c|cancel)(\s|$)/i.test(body);

    const input = isCancel
      ? body.replace(/^(c|cancel)\s*/i, "").trim()
      : body;

    const numbers = input.split(/\s+/).filter(Boolean);

    if (!numbers.length) {
      return api.sendMessage(
        "❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝑬𝒏𝒕𝒆𝒓 𝑮𝒓𝒐𝒖𝒑 𝑵𝒖𝒎𝒃𝒆𝒓!",
        threadID,
        messageID
      );
    }

    for (const num of numbers) {
      if (
        !/^\d+$/.test(num) ||
        Number(num) < 1 ||
        Number(num) > Reply.pending.length
      ) {
        return api.sendMessage(
          getLang("invalidNumber", num),
          threadID,
          messageID
        );
      }
    }

    let count = 0;

    for (const num of numbers) {
      const target = Reply.pending[Number(num) - 1];

      try {
        if (isCancel) {
          await api.removeUserFromGroup(
            api.getCurrentUserID(),
            target.threadID
          );
        } else {
          const info = await api.getThreadInfo(target.threadID);

          const groupName = info.threadName || "𝑼𝒏𝒏𝒂𝒎𝒆𝒅 𝑮𝒓𝒐𝒖𝒑";
          const members = info.participantIDs
            ? info.participantIDs.length
            : 0;

          const time = new Date().toLocaleString("en-BD", {
            timeZone: "Asia/Dhaka"
          });

          const message =
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 𓆩 🖤 𓆪 𝑺𝑯𝑰𝑺𝑯𝑰𝑹 𝑩𝑶𝑻
┃
┃ ✦ 𝑮𝑹𝑶𝑼𝑷 𝑪𝑶𝑵𝑵𝑬𝑪𝑻𝑬𝑫 ✦
┃
┃ 🏷️ 𝑵𝒂𝒎𝒆: ${groupName}
┃ 🆔 𝑮𝒓𝒐𝒖𝒑 𝑰𝑫: ${target.threadID}
┃ 👥 𝑴𝒆𝒎𝒃𝒆𝒓𝒔: ${members}
┃ ⏰ 𝑻𝒊𝒎𝒆: ${time}
┃
╠━━━━━━━━━━━━━━━━━━━━╣
┃ 𓆩 👑 𓆪 𝑶𝑾𝑵𝑬𝑹 𝑰𝑵𝑭𝑶
┃
┃ 🧑‍💻 𝑵𝒂𝒎𝒆: 『𝑺𝑯𝑰𝑺𝑯𝑰𝑹』
┃ 🌍 𝑪𝒐𝒖𝒏𝒕𝒓𝒚: Bangladesh 🇧🇩
┃ ✅ 𝑺𝒕𝒂𝒕𝒖𝒔: Active
┃
┃ 💡 𝑻𝒚𝒑𝒆 /help 𝑭𝒐𝒓 𝑪𝒐𝒎𝒎𝒂𝒏𝒅𝒔!
╰━━━━━━━━━━━━━━━━━━━━╯`;

          await api.sendMessage(message, target.threadID);
        }

        count++;
      } catch (error) {
        console.error("[PENDING ACTION ERROR]", error);
      }
    }

    return api.sendMessage(
      isCancel
        ? getLang("cancelSuccess", count)
        : getLang("approveSuccess", count),
      threadID,
      messageID
    );
  }
};
