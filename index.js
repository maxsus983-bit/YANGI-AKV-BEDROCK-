const bedrock = require('bedrock-protocol');
const express = require('express');

// Render o'chib qolmasligi uchun HTTP server
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('AKV Bot ishlamoqda!'));
app.listen(PORT, () => console.log(`Web server ${PORT}-portda ishda.`));

const HOST = 'Soloraft.aternos.me';
const PORT_MC = 27295;
const USERNAME = 'AKV_Bot';

function startBot() {
  console.log(`[*] Serverga ulanishga harakat qilinmoqda...`);
  
  const client = bedrock.createClient({
    host: HOST,
    port: PORT_MC,
    username: USERNAME,
    offline: true,
    version: false
  });

  client.on('spawn', () => {
    console.log('[+] Bot serverga muvaffaqiyatli kirdi!');
  });

  client.on('error', (err) => {
    console.log('[!] Xatolik:', err.message);
  });

  client.on('close', () => {
    console.log('[-] Ulanish uzildi. 15 sekunddan so\'ng qayta ulanamiz...');
    setTimeout(startBot, 15000);
  });
}

startBot();
