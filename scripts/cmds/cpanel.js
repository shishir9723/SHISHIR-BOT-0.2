const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const GIFEncoder = require("gifencoder");
const os = require("os");

module.exports = {
  config: {
    name: "cpanel",
    version: "19.0",
    author: "Ariyan ",
    countDown: 8,
    role: 2,
    description: "Galaxy Starburst Style Bot System Status",
    category: "system",
  },

  onStart: async function ({ api, event, message, usersData }) {
    // তোমার ফিক্সড আইডি যাতে সবসময় তোমার প্রোফাইল শো করে
    const ownerID = "61593785589368";

    try {
      const wait = await message.reply("⚙️ wait faaa!");

      // HD প্রোফাইল পিকচার
      const avatarUrl = await usersData.getAvatarUrl(ownerID);
      const avatarImg = await loadImage(avatarUrl);

      // সিস্টেম ডাটা
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = Math.floor(uptime % 60);
      const totalRAM = (os.totalmem() / 1024 ** 3).toFixed(2);
      const usedRAM = ((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(2);
      const ramPercent = ((usedRAM / totalRAM) * 100).toFixed(0);

      const width = 1000,
        height = 1000;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      const encoder = new GIFEncoder(width, height);
      const path = __dirname + `/cache/galaxy_up_${ownerID}.gif`;

      if (!fs.existsSync(__dirname + "/cache"))
        fs.mkdirSync(__dirname + "/cache");
      const stream = fs.createWriteStream(path);
      encoder.createReadStream().pipe(stream);
      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(80); // স্মুথ অরবিট
      encoder.setQuality(1);

      // ১০০টি প্রিমিয়াম কণা
      const particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 0.5,
        speed: Math.random() * 4 + 1,
      }));

      // অরবিটিং গ্রহগুলোর ডাটা
      const planets = [
        { l: "⏱️ UP", v: `${hours}h ${mins}m` },
        { l: "💾 RAM", v: `${ramPercent}%` },
        { l: "🖥️ TOTAL", v: `${totalRAM}GB` },
        { l: "🔋 USED", v: `${usedRAM}GB` },
        { l: "⚙️ CORES", v: os.cpus().length },
        { l: "📡 ARCH", v: os.arch() },
        { l: "🖥️ OS", v: os.platform().toUpperCase() },
        { l: "📡 PING", v: "45ms" },
      ];

      for (let i = 0; i < 20; i++) {
        // ২০ ফ্রেমের স্মুথ এনিমেশন
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // পার্টিকেলস
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, (p.y - i * p.speed) % height, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        const centerX = width / 2;
        const centerY = height / 2;

        // অরবিটিং গ্রহগুলো আঁকা (ভিডিওর মতো হুবহু)
        planets.forEach((p, idx) => {
          const angle = idx * (Math.PI / 4) + i * 0.08; // গ্রহগুলোর ঘোরার কোণ
          const radius = 380; // অরবিট ব্যাসার্ধ
          const px = centerX + radius * Math.cos(angle);
          const py = centerY + radius * Math.sin(angle);
          const planetHue = (i * 18 + idx * 45) % 360;

          // নিওন গ্লো বক্স (গ্রহ)
          ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
          ctx.beginPath();
          ctx.arc(px, py, 75, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `hsla(${planetHue}, 100%, 50%, 0.8)`;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${planetHue}, 100%, 50%, 1)`;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // গ্রহের ভেতর ডাটা
          ctx.textAlign = "center";
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 24px Arial";
          ctx.fillText(p.l, px, py - 10);
          ctx.fillStyle = "#00FFFF";
          ctx.font = "bold 20px Arial";
          ctx.fillText(p.v, px, py + 25);
        });

        // মাঝখানের ওনার প্রোফাইল
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, centerX - 150, centerY - 150, 300, 300); // বড় এইচডি ছবি
        ctx.restore();

        // প্রোফাইলের চারপাশের নিওন লুপ
        const hue = (i * 18) % 360;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 160, 0, Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 1)`;
        ctx.shadowBlur = 25;
        ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1)`;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ওনারের নাম
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Shishir Ahmed ", centerX, centerY + 210);

        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on("finish", () => {
        api.unsendMessage(wait.messageID);
        message.reply(
          {
            body: "🚀 faaa!",
            attachment: fs.createReadStream(path),
          },
          () => fs.unlinkSync(path)
        );
      });
    } catch (err) {
      console.error(err);
      message.reply("❌ জানু, ফাইল সাইজ বড় হওয়ায় প্রসেসিং এরর হয়েছে।");
    }
  },
};
