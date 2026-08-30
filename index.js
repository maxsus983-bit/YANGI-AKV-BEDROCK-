const bedrock = require('bedrock-protocol');

const HOST = 'Soloraft.aternos.me';
const PORT_MC = 27295;
const USERNAME = 'AKV_Bot';

const CHECK_INTERVAL = 15000; // Server o'chiq bo'lsa, har 15 sekundda qayta urinadi

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startBot() {
  console.log(`[*] ${HOST}:${PORT_MC} manziliga ulanishga harakat qilinmoqda... (Server yoniqligiga ishonch hosil qiling!)`);

  let client;
  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT_MC,
      username: USERNAME,
      offline: true,
      version: false,
      connectTimeout: 20000 // Server 20 sekund ichida javob bermasa, qotib qolmasdan to'xtatib, qayta urinadi
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
    console.log('[!] Xatolik:', err.message);
  });

  client.on('close', () => {
    if (isConnected) {
      console.log('[-] Server yopildi yoki bot chiqarib yuborildi.');
    } else {
      console.log('[-] Serverga ulanib bo‘lmadi (ehtimol o‘chiq).');
    }
    retryConnection();
  });
}

async function retryConnection() {
  console.log(`[i] Server qayta yonguncha ${CHECK_INTERVAL / 1000} sekund kutilyapti...`);
  await wait(CHECK_INTERVAL);
  startBot();
}

startBot();
