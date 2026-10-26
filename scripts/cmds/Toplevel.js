"use strict";

/** * ===================================================== * TOPLEVEL.JS - PREMIUM LEVEL LEADERBOARD * ARIYAN AI * * Same GIF setup as working spy.js * NO mongoose * NO utils * NO extra database * ===================================================== */

if (typeof process.stderr.clearLine !== "function") {
  process.stderr.clearLine = function () {};
}

if (typeof process.stderr.cursorTo !== "function") {
  process.stderr.cursorTo = function () {};
}

const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");
const moment = require("moment");
const GIFEncoder = require("gifencoder");

// =====================================================
// NUMBER FORMAT
// =====================================================

const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];

function shortenNumber(num) {
  num = Number(num) || 0;

  if (num < 1000) {
    return Math.floor(num).toString();
  }

  let unitIndex = 0;
  let n = num;

  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }

  return n.toFixed(2).replace(/\.?0+$/, "") + units[unitIndex];
}

// =====================================================
// LEVEL SYSTEM
// =====================================================

function getLevelInfo(exp) {
  let level = 1;
  let expNeed = 100;

  exp = Number(exp) || 0;

  while (exp >= expNeed) {
    exp -= expNeed;
    level++;

    expNeed = level * 100 + 70;
  }

  return {
    level,
    curExp: exp,
    expNeed,
  };
}

// =====================================================
// CANVAS HELPERS
// =====================================================

function roundedRect(ctx, x, y, width, height, radius) {
  radius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.lineTo(x + width - radius, y);

  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  ctx.lineTo(x + width, y + height - radius);

  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

  ctx.lineTo(x + radius, y + height);

  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  ctx.lineTo(x, y + radius);

  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align = "left", bold = false) {
  ctx.font = `${bold ? "bold " : ""}${size}px Sans`;

  ctx.fillStyle = color;

  ctx.textAlign = align;

  ctx.textBaseline = "middle";

  ctx.fillText(String(value), x, y);
}

// =====================================================
// PROGRESS BAR
// =====================================================

function drawProgressBar(ctx, x, y, width, height, percent) {
  percent = Math.max(0, Math.min(100, percent));

  ctx.fillStyle = "#24263d";

  roundedRect(ctx, x, y, width, height, height / 2);

  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y, x + width, y);

  gradient.addColorStop(0, "#00f5a0");

  gradient.addColorStop(0.5, "#00d9ff");

  gradient.addColorStop(1, "#c86cff");

  const fillWidth = width * (percent / 100);

  if (fillWidth > 0) {
    ctx.fillStyle = gradient;

    roundedRect(ctx, x, y, fillWidth, height, height / 2);

    ctx.fill();
  }
}

// =====================================================
// DIMENSIONS
// =====================================================

const W = 1200;

const HEADER_Y = 30;
const HEADER_H = 190;

const ROW_Y = 240;
const ROW_H = 105;

const FOOTER_H = 75;

const H = ROW_Y + ROW_H * 10 + FOOTER_H;

// =====================================================
// MODULE
// =====================================================

module.exports = {
  config: {
    name: "toplevel",

    aliases: ["toplvl", "leveltop", "toplevel"],

    version: "2.0.0",

    author: "ARIYAN AI",

    countDown: 5,

    role: 0,

    shortDescription: {
      en: "Premium animated level leaderboard",
    },

    longDescription: {
      en: "Shows the top 10 users according to their experience and level.",
    },

    category: "system",

    guide: {
      en: "{pn}",
    },
  },

  // ===================================================
  // START
  // ===================================================

  onStart: async function ({ api, event, usersData }) {
    let tmp = null;

    try {
      // ===============================================
      // GET USERS
      // ===============================================

      const allUsers = (await usersData.getAll()) || [];

      if (!Array.isArray(allUsers) || allUsers.length === 0) {
        return api.sendMessage(
          "❌ কোনো user database-এ পাওয়া যায়নি!",
          event.threadID,
          event.messageID
        );
      }

      // ===============================================
      // SORT BY EXP
      // ===============================================

      const sortedUsers = allUsers
        .filter((u) => u && u.userID && u.exp !== undefined && u.exp !== null)
        .sort((a, b) => Number(b.exp || 0) - Number(a.exp || 0));

      const top10 = sortedUsers.slice(0, 10);

      // ===============================================
      // PREPARE DATA
      // ===============================================

      const leaderboard = [];

      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];

        const exp = Number(user.exp) || 0;

        const levelInfo = getLevelInfo(exp);

        let name = "Unknown User";

        try {
          name = (await usersData.getName(user.userID)) || "Unknown User";
        } catch {}

        leaderboard.push({
          rank: i + 1,

          userID: String(user.userID),

          name: String(name),

          exp,

          level: levelInfo.level,

          currentExp: levelInfo.curExp,

          expNeed: levelInfo.expNeed,
        });
      }

      // ===============================================
      // TEMP DIRECTORY
      // ===============================================

      const tempDir = path.join(__dirname, "../temp");

      await fs.ensureDir(tempDir);

      tmp = path.join(tempDir, `toplevel-${Date.now()}.gif`);

      // ===============================================
      // GIF ENCODER
      // Same setup as spy.js
      // ===============================================

      const enc = new GIFEncoder(W, H);

      const gifStream = fs.createWriteStream(tmp);

      enc.createReadStream().pipe(gifStream);

      enc.start();

      enc.setRepeat(0);

      enc.setDelay(1000 / 8);

      enc.setQuality(10);

      // ===============================================
      // FRAMES
      // ===============================================

      const FRAMES = 8;

      for (let frame = 0; frame < FRAMES; frame++) {
        const cv = Canvas.createCanvas(W, H);

        const ctx = cv.getContext("2d");

        // =============================================
        // BACKGROUND
        // =============================================

        const bg = ctx.createLinearGradient(0, 0, W, H);

        bg.addColorStop(0, "#090b1c");

        bg.addColorStop(0.35, "#11142d");

        bg.addColorStop(0.7, "#12112d");

        bg.addColorStop(1, "#090918");

        ctx.fillStyle = bg;

        ctx.fillRect(0, 0, W, H);

        // =============================================
        // PARTICLES
        // =============================================

        for (let i = 0; i < 110; i++) {
          const x = Math.random() * W;

          const y = Math.random() * H;

          ctx.beginPath();

          ctx.arc(x, y, Math.random() * 1.8 + 0.3, 0, Math.PI * 2);

          ctx.fillStyle = `rgba(255,255,255,${( Math.random() * 0.65 + 0.15 ).toFixed(2)})`;

          ctx.fill();
        }

        // =============================================
        // ANIMATED BORDER
        // =============================================

        const phase = frame / FRAMES;

        const border = ctx.createLinearGradient(0, 0, W, H);

        border.addColorStop(0, `hsl(${phase * 360},100%,60%)`);

        border.addColorStop(0.5, `hsl(${(phase + 0.5) * 360},100%,60%)`);

        border.addColorStop(1, `hsl(${(phase + 1) * 360},100%,60%)`);

        ctx.strokeStyle = border;

        ctx.lineWidth = 10;

        ctx.strokeRect(5, 5, W - 10, H - 10);

        // =============================================
        // HEADER CARD
        // =============================================

        ctx.fillStyle = "rgba(20,22,45,0.96)";

        roundedRect(ctx, 35, HEADER_Y, W - 70, HEADER_H, 28);

        ctx.fill();

        // =============================================
        // HEADER ICON
        // =============================================

        text(ctx, "🏆", 95, 90, 55, "#ffffff", "center");

        // =============================================
        // HEADER TITLE
        // =============================================

        text(ctx, "TOP 10", 150, 75, 43, "#ffffff", "left", true);

        text(ctx, "LEVEL LEADERBOARD", 150, 125, 38, "#c86cff", "left", true);

        // =============================================
        // HEADER RIGHT
        // =============================================

        text(
          ctx,
          `TOTAL USERS: ${allUsers.length}`,
          1120,
          75,
          21,
          "#858aa5",
          "right",
          true
        );

        text(
          ctx,
          "RANKED BY EXPERIENCE",
          1120,
          115,
          18,
          "#00d9ff",
          "right",
          true
        );

        // =============================================
        // LEADERBOARD
        // =============================================

        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];

          const y = ROW_Y + i * ROW_H;

          // -------------------------------------------
          // ROW COLOR
          // -------------------------------------------

          let rowColor = "#171a32";

          if (user.rank === 1) {
            rowColor = "rgba(255,212,59,0.17)";
          } else if (user.rank === 2) {
            rowColor = "rgba(220,225,235,0.13)";
          } else if (user.rank === 3) {
            rowColor = "rgba(205,127,50,0.15)";
          }

          ctx.fillStyle = rowColor;

          roundedRect(ctx, 35, y, W - 70, ROW_H - 10, 20);

          ctx.fill();

          // -------------------------------------------
          // RANK COLOR
          // -------------------------------------------

          let rankColor = "#777d98";

          if (user.rank === 1) {
            rankColor = "#ffd43b";
          } else if (user.rank === 2) {
            rankColor = "#e2e8f0";
          } else if (user.rank === 3) {
            rankColor = "#cd7f32";
          }

          // -------------------------------------------
          // RANK
          // -------------------------------------------

          ctx.beginPath();

          ctx.arc(90, y + 43, 31, 0, Math.PI * 2);

          ctx.fillStyle = "rgba(255,255,255,0.06)";

          ctx.fill();

          text(ctx, `#${user.rank}`, 90, y + 43, 22, rankColor, "center", true);

          // -------------------------------------------
          // NAME
          // -------------------------------------------

          let displayName = user.name;

          if (displayName.length > 24) {
            displayName = displayName.slice(0, 21) + "...";
          }

          text(ctx, displayName, 145, y + 34, 27, "#ffffff", "left", true);

          text(ctx, `UID: ${user.userID}`, 145, y + 68, 15, "#707690", "left");

          // -------------------------------------------
          // LEVEL
          // -------------------------------------------

          text(
            ctx,
            `LEVEL ${user.level}`,
            650,
            y + 35,
            27,
            "#c86cff",
            "center",
            true
          );

          text(
            ctx,
            "CURRENT LEVEL",
            650,
            y + 68,
            14,
            "#777d98",
            "center",
            true
          );

          // -------------------------------------------
          // EXP
          // -------------------------------------------

          text(
            ctx,
            `${shortenNumber(user.exp)} XP`,
            1080,
            y + 34,
            27,
            "#00f5a0",
            "right",
            true
          );

          text(
            ctx,
            `${shortenNumber(user.currentExp)} / ${shortenNumber( user.expNeed )} NEXT`,
            1080,
            y + 68,
            14,
            "#777d98",
            "right",
            true
          );

          // -------------------------------------------
          // EXP PROGRESS
          // -------------------------------------------

          const progress =
            user.expNeed > 0 ? (user.currentExp / user.expNeed) * 100 : 0;

          drawProgressBar(ctx, 810, y + 79, 230, 9, progress);
        }

        // =============================================
        // EMPTY ROWS
        // =============================================

        if (leaderboard.length < 10) {
          for (let i = leaderboard.length; i < 10; i++) {
            const y = ROW_Y + i * ROW_H;

            ctx.fillStyle = "rgba(255,255,255,0.025)";

            roundedRect(ctx, 35, y, W - 70, ROW_H - 10, 20);

            ctx.fill();

            text(ctx, `#${i + 1}`, 90, y + 43, 22, "#454a62", "center", true);

            text(ctx, "No user data", 145, y + 43, 22, "#454a62", "left");
          }
        }

        // =============================================
        // FOOTER
        // =============================================

        const footerY = ROW_Y + ROW_H * 10;

        ctx.fillStyle = "rgba(5,6,17,0.95)";

        ctx.fillRect(0, footerY, W, FOOTER_H);

        text(
          ctx,
          "⚡ ARIYAN AI • LEVEL SYSTEM",
          40,
          footerY + 35,
          18,
          "#777d98",
          "left",
          true
        );

        text(
          ctx,
          moment().format("DD/MM/YYYY • hh:mm A"),
          W - 40,
          footerY + 35,
          17,
          "#777d98",
          "right"
        );

        // =============================================
        // ADD FRAME
        // =============================================

        enc.addFrame(ctx);
      }

      // ===============================================
      // FINISH
      // ===============================================

      enc.finish();

      await new Promise((resolve, reject) => {
        gifStream.on("finish", resolve);

        gifStream.on("error", reject);
      });

      // ===============================================
      // SEND
      // ===============================================

      await api.sendMessage(
        {
          body: "🏆 TOP 10 LEVEL LEADERBOARD",
          attachment: fs.createReadStream(tmp),
        },

        event.threadID,

        () => {
          try {
            if (tmp && fs.existsSync(tmp)) {
              fs.unlinkSync(tmp);
            }
          } catch {}
        }
      );
    } catch (error) {
      console.error("[TOPLEVEL ERROR]", error);

      try {
        if (tmp && fs.existsSync(tmp)) {
          fs.unlinkSync(tmp);
        }
      } catch {}

      return api.sendMessage(
        `⚠️ TopLevel Error:\n${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
