const { Client, ping } = require('bedrock-protocol');

const CONFIG = {
    host: 'soloraft.aternos.me',
    port: 27295,
    username: 'AFK_Bot',
    offline: true,
    reconnectInterval: 5000,
    moveInterval: 15000
};

let moveIntervalId = null;
let isConnecting = false;

function connectBot() {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`[LOG] Server tekshirilmoqda va ulanishga harakat qilinmoqda: ${CONFIG.host}:${CONFIG.port}`);

    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }

    // Aternos serveri ochiq yoki yo'qligini ping orqali tekshirib keyin ulanish
    ping({ host: CONFIG.host, port: CONFIG.port }, (err, response) => {
        if (err) {
            console.log('[WARNING] Server o\'chiq yoki javob bermayapti. Qayta urinilmoqda...');
            isConnecting = false;
            setTimeout(connectBot, CONFIG.reconnectInterval);
            return;
        }

        console.log(`[INFO] Server topildi! Versiya: ${response.version?.name || 'Noma\'lum'}`);

        try {
            const client = new Client({
                host: CONFIG.host,
                port: CONFIG.port,
                username: CONFIG.username,
                offline: CONFIG.offline,
                realms: false
            });

            client.on('spawn', () => {
                console.log('[SUCCESS] Bot serverga muvaffaqiyatli kirdi va AFK rejimiga oʻtdi!');
                isConnecting = false;
                startAntiAfk(client);
            });

            client.on('error', (err) => {
                console.log('[ERROR] Bot xatolikka uchradi:', err.message || err);
            });

            client.on('close', () => {
                console.log('[WARNING] Server bilan aloqa uzildi.');
                isConnecting = false;
                if (moveIntervalId) clearInterval(moveIntervalId);
                setTimeout(connectBot, CONFIG.reconnectInterval);
            });

        } catch (error) {
            console.log('[CRITICAL] Klientni yaratishda xatolik:', error.message);
            isConnecting = false;
            setTimeout(connectBot, CONFIG.reconnectInterval);
        }
    });
}

function startAntiAfk(client) {
    if (moveIntervalId) clearInterval(moveIntervalId);

    moveIntervalId = setInterval(() => {
        try {
            console.log('[ANTIAFK] Bot serverda faollik koʻrsatmoqda.');
            // Kerak bo'lsa bu yerda paket yuborish amallarini bajarish mumkin
        } catch (e) {
            console.log('[ANTIAFK ERROR]:', e.message);
        }
    }, CONFIG.moveInterval);
}

process.on('uncaughtException', (err) => {
    console.log('[FATAL ERROR]:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.log('[FATAL ERROR Unhandled]:', reason);
});

// Ishga tushirish
connectBot();
    
