const { Client, ping } = require('bedrock-protocol');

const CONFIG = {
    host: 'Soloraft.aternos.me',
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

    console.log(`[LOG] Server statusi tekshirilmoqda: ${CONFIG.host}:${CONFIG.port}`);

    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }

    // Ping funksiyasiga vaqt chegarasi (timeout) qo'shildi
    const pingTimeout = setTimeout(() => {
        console.log('[WARNING] Serverga ping vaqti tugadi (server o\'chiq bo\'lishi mumkin). Qayta urinilmoqda...');
        isConnecting = false;
        setTimeout(connectBot, CONFIG.reconnectInterval);
    }, 7000);

    ping({ host: CONFIG.host, port: CONFIG.port, timeout: 5000 }, (err, response) => {
        clearTimeout(pingTimeout);

        if (err) {
            console.log('[WARNING] Serverga ulanib bo\'lmadi. Aternos o\'chiq bo\'lishi mumkin. 5 sekunddan so\'ng qayta tekshiriladi...');
            isConnecting = false;
            setTimeout(connectBot, CONFIG.reconnectInterval);
            return;
        }

        console.log(`[INFO] Server yoniq! Versiya: ${response?.version?.name || 'Bedrock'}`);

        try {
            const client = new Client({
                host: CONFIG.host,
                port: CONFIG.port,
                username: CONFIG.username,
                offline: CONFIG.offline
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

connectBot();
