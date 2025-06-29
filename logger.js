const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'bot-logs.txt');

function log(message, client) {
  const timestamp = new Date().toLocaleString();
  const finalMsg = `[${timestamp}] ${message}\n`;

  // اطبع في الكونسول
  console.log(finalMsg);

  // اكتب في ملف
  fs.appendFile(LOG_FILE, finalMsg, err => {
    if (err) console.error('❌ فشل في تسجيل اللوج:', err);
  });

  // لو فيه تشانل لوج من .env ابعته هناك كمان
  if (client && process.env.LOG_CHANNEL_ID) {
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (channel) channel.send(`📝 ${message}`);
  }
}

module.exports = { log };
