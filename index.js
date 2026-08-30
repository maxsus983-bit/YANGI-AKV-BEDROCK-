const bedrock = require('bedrock-protocol');

const HOST = 'Soloraft.aternos.me';
const PORT_MC = 27295;
const USERNAME = 'AKV_Bot';

const CHECK_INTERVAL = 15000;

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
      version: false, // <-- Versiyani avtomatik aniqlashi uchun 'false' qilindi
    });
  } catch (err) {
    console.log('[!] Ulanishda xatolik:', err.message);
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
      console.log('[-] Server bilan ulanish uzildi.');
    }
    retryConnection();
  });
}

async function retryConnection() {
  console.log(`[i] Server qayta yonguncha kutilyapti...`);
  await wait(CHECK_INTERVAL);
  startBot();
}

startBot();
