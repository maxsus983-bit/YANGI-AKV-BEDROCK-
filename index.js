const bedrock = require('bedrock-protocol');
const express = require('express');

// --- Veb-server (Hosting o'chib qolmasligi uchun) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('AKV_Bot 24/7 ishlamoqda va serverni kuzatmoqda!');
});

app.listen(PORT, () => {
  console.log(`[i] Veb server ${PORT}-portda ishga tushdi.`);
});

// --- Minecraft Bedrock Bot Sozlamalari ---
const HOST = 'Soloraft.aternos.me';
const PORT_MC = 27295;
const USERNAME = 'AKV_Bot';

const CHECK_INTERVAL = 15000; // Server o'chiq bo'lsa, har 15 sekundda qayta tekshiradi

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startBot() {
  console.log(`[*] ${HOST}:${PORT_MC} manziliga ulanishga harakat qilinmoqda...`);

  let client;
  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT_MC,
      username: USERNAME,
      offline: true,
      version: '1.20.0', // Kerak bo'lsa versiyani o'zgartirishingiz mumkin
    });
  } catch (err) {
    console.log('[!] Ulanishni boshlashda xatolik:', err.message);
    retryConnection();
    return;
  }

  let isConnected = false;

  client.on('spawn', () => {
    isConnected = true;
    console.log('[+] Bot serverga muvaffaqiyatli kirdi va AFK rejimida ishlamoqda!');
  });

  client.on('error', (err) => {
    console.log('[!] Tarmoq yoki server xatoligi:', err.message);
  });

  client.on('close', () => {
    if (isConnected) {
      console.log('[-] Server yopildi yoki bot chiqarib yuborildi.');
    } else {
      console.log('[-] Server hozircha o‘chiq ko‘rinadi.');
    }
    retryConnection();
  });
}

async function retryConnection() {
  console.log(`[i] Server qayta yonguncha kutilyapti... ${CHECK_INTERVAL / 1000} sekunddan so'ng yana urinib ko'ramiz.`);
  await wait(CHECK_INTERVAL);
  startBot();
}

// Botni ishga tushirish
startBot();
  
