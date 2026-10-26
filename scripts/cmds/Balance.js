"use strict";

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "top",
    version: "8.0",
    author: "Ariyan ai",
    role: 0,

    shortDescription: {
      en: "Premium EXP & Balance Leaderboard",
    },

    longDescription: {
      en: "Show top users by EXP or balance with a stylish leaderboard image.",
    },

    category: "ECONOMY",

    guide: {
      en:
        "{pn} rank - Top EXP leaderboard\n" +
        "{pn} bal - Top balance leaderboard",
    },
  },

  onStart: async function ({ event, usersData, message }) {
    // ==========================================
    // MODE
    // ==========================================

    const args = (event.body || "").trim().split(/\s+/);
    const mode = args[1]?.toLowerCase();

    if (!mode || !["rank", "bal", "balance"].includes(mode)) {
      return message.reply(
        "❌ Usage:\n\n" +
          "🏆 /top rank\n" +
          "→ Top EXP leaderboard\n\n" +
          "💰 /top bal\n" +
          "→ Top Balance leaderboard"
      );
    }

    const isRank = mode === "rank";

    // ==========================================
    // TITLE
    // ==========================================

    const title = isRank
      ? "EXPERIENCE RANK LEADERBOARD"
      : "TOP BALANCE LEADERBOARD";

    const subtitle = isRank
      ? "THE STRONGEST PLAYERS BY EXPERIENCE"
      : "THE RICHEST PLAYERS IN THE ECONOMY";

    // ==========================================
    // GET USERS
    // ==========================================

    let allUsers;

    try {
      allUsers = await usersData.getAll();
    } catch (error) {
      console.error("TOP getAll Error:", error);

      return message.reply("❌ User data load করতে সমস্যা হয়েছে।");
    }

    if (!Array.isArray(allUsers) || allUsers.length === 0) {
      return message.reply("❌ কোনো user data পাওয়া যায়নি।");
    }

    // ==========================================
    // VALUE
    // ==========================================

    const getValue = (user) => {
      const value = isRank ? Number(user.exp || 0) : Number(user.money || 0);

      return Number.isFinite(value) ? value : 0;
    };

    // ==========================================
    // SORT ALL USERS
    // IMPORTANT:
    // We sort ALL users first so the user's
    // actual global rank can be calculated.
    // ==========================================

    const sortedUsers = allUsers
      .filter((user) => user && user.userID)
      .sort((a, b) => {
        return getValue(b) - getValue(a);
      });

    if (!sortedUsers.length) {
      return message.reply("❌ Leaderboard empty.");
    }

    // ==========================================
    // TOP 17
    // ==========================================

    const topUsers = sortedUsers.slice(0, 17);

    // ==========================================
    // CURRENT USER
    // ==========================================

    const currentUserID = String(event.senderID);

    let currentUserIndex = sortedUsers.findIndex(
      (user) => String(user.userID) === currentUserID
    );

    let currentUser;

    if (currentUserIndex !== -1) {
      currentUser = sortedUsers[currentUserIndex];
    } else {
      // Sometimes the sender isn't returned by getAll()
      try {
        currentUser = await usersData.get(currentUserID);
      } catch (_) {}

      if (!currentUser) {
        currentUser = {
          userID: currentUserID,
          name: "Unknown",
          exp: 0,
          money: 0,
        };
      }

      // Calculate approximate rank
      currentUserIndex = sortedUsers.filter(
        (user) => getValue(user) > getValue(currentUser)
      ).length;
    }

    const currentRank = currentUserIndex + 1;

    // ==========================================
    // FORMAT NUMBER
    // ==========================================

    function formatNumber(num) {
      num = Number(num) || 0;

      const units = [
        { value: 1e18, suffix: "Qi" },
        { value: 1e15, suffix: "Qa" },
        { value: 1e12, suffix: "T" },
        { value: 1e9, suffix: "B" },
        { value: 1e6, suffix: "M" },
        { value: 1e3, suffix: "K" },
      ];

      for (const unit of units) {
        if (num >= unit.value) {
          return (
            (num / unit.value)
              .toFixed(2)
              .replace(/\.00$/, "")
              .replace(/(\.\d)0$/, "$1") + unit.suffix
          );
        }
      }

      return Math.floor(num).toLocaleString();
    }

    // ==========================================
    // SAFE NAME
    // ==========================================

    function safeName(name) {
      return (
        String(name || "Unknown")
          .replace(/[<>]/g, "")
          .trim() || "Unknown"
      );
    }

    // ==========================================
    // TEXT TRUNCATE
    // ==========================================

    function truncate(ctx, text, maxWidth) {
      text = String(text);

      if (ctx.measureText(text).width <= maxWidth) {
        return text;
      }

      let result = text;

      while (
        result.length > 1 &&
        ctx.measureText(result + "…").width > maxWidth
      ) {
        result = result.slice(0, -1);
      }

      return result + "…";
    }

    // ==========================================
    // CANVAS
    // ==========================================

    const WIDTH = 1000;
    const HEIGHT = 1780;

    const canvas = createCanvas(WIDTH, HEIGHT);

    const ctx = canvas.getContext("2d");

    // ==========================================
    // BACKGROUND
    // ==========================================

    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);

    bg.addColorStop(0, "#07152f");
    bg.addColorStop(0.45, "#0c2450");
    bg.addColorStop(1, "#071329");

    ctx.fillStyle = bg;

    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ==========================================
    // BACKGROUND GLOW
    // ==========================================

    const glow = ctx.createRadialGradient(
      WIDTH / 2,
      180,
      20,
      WIDTH / 2,
      180,
      550
    );

    glow.addColorStop(
      0,
      isRank ? "rgba(168,85,247,0.35)" : "rgba(59,130,246,0.35)"
    );

    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = glow;

    ctx.fillRect(0, 0, WIDTH, 700);

    // ==========================================
    // STARS
    // ==========================================

    for (let i = 0; i < 180; i++) {
      const x = Math.random() * WIDTH;

      const y = Math.random() * HEIGHT;

      const radius = Math.random() * 1.8 + 0.3;

      ctx.beginPath();

      ctx.arc(x, y, radius, 0, Math.PI * 2);

      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.45 + 0.1})`;

      ctx.fill();
    }

    // ==========================================
    // HEADER
    // ==========================================

    ctx.textAlign = "center";

    ctx.font = "bold 38px Arial";

    ctx.fillStyle = isRank ? "#d8b4fe" : "#93c5fd";

    ctx.shadowColor = isRank ? "rgba(168,85,247,0.9)" : "rgba(59,130,246,0.9)";

    ctx.shadowBlur = 22;

    ctx.fillText(title, WIDTH / 2, 65);

    ctx.shadowBlur = 0;

    ctx.font = "16px Arial";

    ctx.fillStyle = "#b8c7e6";

    ctx.fillText(subtitle, WIDTH / 2, 95);

    // ==========================================
    // HEADER LINE
    // ==========================================

    const lineGradient = ctx.createLinearGradient(100, 0, 900, 0);

    lineGradient.addColorStop(0, "rgba(255,255,255,0)");

    lineGradient.addColorStop(0.5, isRank ? "#a855f7" : "#38bdf8");

    lineGradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = lineGradient;

    ctx.fillRect(100, 125, 800, 2);

    // ==========================================
    // AVATAR CACHE
    // ==========================================

    const avatarCache = {};

    const avatarUsers = [...topUsers];

    if (
      currentUser &&
      !avatarUsers.some((u) => String(u.userID) === String(currentUser.userID))
    ) {
      avatarUsers.push(currentUser);
    }

    for (const user of avatarUsers) {
      try {
        let avatarURL = null;

        try {
          avatarURL = await usersData.getAvatarUrl(user.userID);
        } catch (_) {}

        if (!avatarURL) continue;

        const response = await axios.get(avatarURL, {
          responseType: "arraybuffer",
          timeout: 8000,
        });

        avatarCache[user.userID] = await loadImage(Buffer.from(response.data));
      } catch (_) {}
    }

    // ==========================================
    // DRAW AVATAR
    // ==========================================

    function drawAvatar(user, x, y, radius, borderColor) {
      if (!user) return;

      // Glow ring
      ctx.save();

      ctx.beginPath();

      ctx.arc(x, y, radius + 8, 0, Math.PI * 2);

      ctx.strokeStyle = borderColor;

      ctx.lineWidth = 4;

      ctx.shadowColor = borderColor;

      ctx.shadowBlur = 22;

      ctx.stroke();

      ctx.restore();

      // Avatar
      ctx.save();

      ctx.beginPath();

      ctx.arc(x, y, radius, 0, Math.PI * 2);

      ctx.clip();

      if (avatarCache[user.userID]) {
        ctx.drawImage(
          avatarCache[user.userID],
          x - radius,
          y - radius,
          radius * 2,
          radius * 2
        );
      } else {
        ctx.fillStyle = "#263858";

        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

        ctx.fillStyle = "#94a3b8";

        ctx.font = `bold ${Math.floor(radius * 0.65)}px Arial`;

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.fillText(safeName(user.name).charAt(0).toUpperCase(), x, y);

        ctx.textBaseline = "alphabetic";
      }

      ctx.restore();

      // Ring
      ctx.beginPath();

      ctx.arc(x, y, radius, 0, Math.PI * 2);

      ctx.strokeStyle = borderColor;

      ctx.lineWidth = 3;

      ctx.stroke();
    }

    // ==========================================
    // TOP 3
    // ==========================================

    const top3 = [
      {
        user: topUsers[1],
        x: 245,
        y: 270,
        r: 75,
        rank: 2,
        color: "#cbd5e1",
      },

      {
        user: topUsers[0],
        x: 500,
        y: 230,
        r: 96,
        rank: 1,
        color: "#facc15",
      },

      {
        user: topUsers[2],
        x: 755,
        y: 270,
        r: 75,
        rank: 3,
        color: "#fb923c",
      },
    ];

    for (const item of top3) {
      if (!item.user) continue;

      drawAvatar(item.user, item.x, item.y, item.r, item.color);

      // Rank badge
      ctx.beginPath();

      ctx.arc(
        item.x + item.r * 0.72,
        item.y - item.r * 0.72,
        22,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = item.color;

      ctx.fill();

      ctx.font = "bold 16px Arial";

      ctx.fillStyle = "#071329";

      ctx.textAlign = "center";

      ctx.textBaseline = "middle";

      ctx.fillText(
        `#${item.rank}`,
        item.x + item.r * 0.72,
        item.y - item.r * 0.72
      );

      ctx.textBaseline = "alphabetic";

      // Name
      ctx.font = "bold 20px Arial";

      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        truncate(ctx, safeName(item.user.name), 210),
        item.x,
        item.y + item.r + 34
      );

      // Value
      ctx.font = "bold 18px Arial";

      ctx.fillStyle = item.color;

      ctx.fillText(
        isRank
          ? `Level ${formatNumber(getValue(item.user))}`
          : `$${formatNumber(getValue(item.user))}`,
        item.x,
        item.y + item.r + 62
      );
    }

    // ==========================================
    // LEADERBOARD LIST
    // ==========================================

    const LIST_START = 435;

    const ROW_H = 62;

    const GAP = 9;

    const maxValue = Math.max(getValue(topUsers[0]), 1);

    for (let i = 3; i < topUsers.length; i++) {
      const user = topUsers[i];

      const y = LIST_START + (i - 3) * (ROW_H + GAP);

      const x = 45;

      const w = WIDTH - 90;

      const h = ROW_H;

      // ========================================
      // CARD
      // ========================================

      ctx.beginPath();

      const radius = 14;

      ctx.moveTo(x + radius, y);

      ctx.lineTo(x + w - radius, y);

      ctx.arcTo(x + w, y, x + w, y + radius, radius);

      ctx.lineTo(x + w, y + h - radius);

      ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);

      ctx.lineTo(x + radius, y + h);

      ctx.arcTo(x, y + h, x, y + h - radius, radius);

      ctx.lineTo(x, y + radius);

      ctx.arcTo(x, y, x + radius, y, radius);

      ctx.closePath();

      ctx.fillStyle = "rgba(30,41,78,0.86)";

      ctx.fill();

      ctx.strokeStyle = "rgba(148,163,184,0.12)";

      ctx.lineWidth = 1;

      ctx.stroke();

      // ========================================
      // RANK
      // ========================================

      ctx.textAlign = "left";

      ctx.font = "bold 17px Arial";

      ctx.fillStyle = "#dbeafe";

      ctx.fillText(`#${i + 1}`, 65, y + 37);

      // ========================================
      // AVATAR
      // ========================================

      const avX = 130;

      const avY = y + ROW_H / 2;

      const avR = 22;

      ctx.save();

      ctx.beginPath();

      ctx.arc(avX, avY, avR, 0, Math.PI * 2);

      ctx.clip();

      if (avatarCache[user.userID]) {
        ctx.drawImage(
          avatarCache[user.userID],
          avX - avR,
          avY - avR,
          avR * 2,
          avR * 2
        );
      } else {
        ctx.fillStyle = "#334155";

        ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
      }

      ctx.restore();

      // Avatar border
      ctx.beginPath();

      ctx.arc(avX, avY, avR, 0, Math.PI * 2);

      ctx.strokeStyle = "rgba(147,197,253,0.35)";

      ctx.lineWidth = 2;

      ctx.stroke();

      // ========================================
      // NAME
      // ========================================

      ctx.font = "bold 18px Arial";

      ctx.fillStyle = "#f1f5f9";

      ctx.fillText(truncate(ctx, safeName(user.name), 190), 175, y + 37);

      // ========================================
      // PROGRESS BAR
      // ========================================

      const barX = 395;

      const barY = y + 27;

      const barW = 250;

      const barH = 9;

      ctx.beginPath();

      ctx.roundRect(barX, barY, barW, barH, 5);

      ctx.fillStyle = "rgba(2,6,23,0.85)";

      ctx.fill();

      const ratio = Math.min(getValue(user) / maxValue, 1);

      const activeW = Math.max(ratio * barW, 7);

      const progressGradient = ctx.createLinearGradient(
        barX,
        0,
        barX + activeW,
        0
      );

      if (isRank) {
        progressGradient.addColorStop(0, "#8b5cf6");

        progressGradient.addColorStop(1, "#c084fc");
      } else {
        progressGradient.addColorStop(0, "#06b6d4");

        progressGradient.addColorStop(1, "#38bdf8");
      }

      ctx.beginPath();

      ctx.roundRect(barX, barY, activeW, barH, 5);

      ctx.fillStyle = progressGradient;

      ctx.shadowColor = isRank ? "#a855f7" : "#22d3ee";

      ctx.shadowBlur = 8;

      ctx.fill();

      ctx.shadowBlur = 0;

      // ========================================
      // VALUE
      // ========================================

      ctx.textAlign = "right";

      ctx.font = "bold 17px Arial";

      ctx.fillStyle = isRank ? "#d8b4fe" : "#7dd3fc";

      ctx.fillText(
        isRank
          ? `${formatNumber(getValue(user))} EXP`
          : `$${formatNumber(getValue(user))}`,
        WIDTH - 65,
        y + 37
      );
    }

    // ==========================================
    // CURRENT USER PANEL
    // ==========================================

    const selfY = 1570;

    const selfX = 45;

    const selfW = WIDTH - 90;

    const selfH = 86;

    // Panel
    ctx.beginPath();

    ctx.roundRect(selfX, selfY, selfW, selfH, 18);

    ctx.fillStyle = "rgba(5,20,50,0.96)";

    ctx.fill();

    ctx.strokeStyle = isRank ? "#a855f7" : "#38bdf8";

    ctx.lineWidth = 2;

    ctx.shadowColor = isRank
      ? "rgba(168,85,247,0.55)"
      : "rgba(56,189,248,0.55)";

    ctx.shadowBlur = 15;

    ctx.stroke();

    ctx.shadowBlur = 0;

    // ==========================================
    // SELF RANK
    // ==========================================

    ctx.textAlign = "left";

    ctx.font = "bold 18px Arial";

    ctx.fillStyle = "#e2e8f0";

    ctx.fillText(`#${currentRank}`, 68, selfY + 51);

    // ==========================================
    // SELF AVATAR
    // ==========================================

    const selfAvatarX = 160;

    const selfAvatarY = selfY + selfH / 2;

    const selfAvatarR = 31;

    drawAvatar(
      currentUser,
      selfAvatarX,
      selfAvatarY,
      selfAvatarR,
      isRank ? "#a855f7" : "#38bdf8"
    );

    // ==========================================
    // SELF NAME
    // ==========================================

    ctx.font = "bold 20px Arial";

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      truncate(ctx, safeName(currentUser.name), 300),
      215,
      selfY + 40
    );

    ctx.font = "14px Arial";

    ctx.fillStyle = "#94a3b8";

    ctx.fillText("YOUR POSITION", 215, selfY + 63);

    // ==========================================
    // SELF VALUE
    // ==========================================

    ctx.textAlign = "right";

    ctx.font = "bold 22px Arial";

    ctx.fillStyle = isRank ? "#d8b4fe" : "#7dd3fc";

    ctx.fillText(
      isRank
        ? `Lv.${formatNumber(getValue(currentUser))} • ${formatNumber( getValue(currentUser) )} EXP`
        : `$${formatNumber(getValue(currentUser))}`,
      WIDTH - 70,
      selfY + 48
    );

    // ==========================================
    // FOOTER
    // ==========================================

    ctx.textAlign = "center";

    ctx.font = "13px Arial";

    ctx.fillStyle = "rgba(191,219,254,0.55)";

    ctx.fillText(
      `✦ SHISHIR ai • ${ isRank ? "Experience Ranking" : "Balance Ranking" } • Total Users: ${sortedUsers.length}`,
      WIDTH / 2,
      HEIGHT - 25
    );

    // ==========================================
    // SAVE IMAGE
    // ==========================================

    const cacheDir = path.join(__dirname, "cache");

    await fs.ensureDir(cacheDir);

    const imagePath = path.join(
      cacheDir,
      `top_${isRank ? "rank" : "bal"}_${Date.now()}.png`
    );

    await fs.writeFile(imagePath, canvas.toBuffer("image/png"));

    // ==========================================
    // SEND
    // ==========================================

    return message.reply(
      {
        body: isRank
          ? `🏆 𝐄𝐗𝐏 𝐑𝐀𝐍𝐊𝐈𝐍𝐆\n\n📍 Your Position: #${currentRank}`
          : `💰 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐑𝐀𝐍𝐊𝐈𝐍𝐆\n\n📍 Your Position: #${currentRank}`,

        attachment: fs.createReadStream(imagePath),
      },

      () => {
        fs.remove(imagePath).catch(() => {});
      }
    );
  },
};
