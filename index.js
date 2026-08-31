const { Client } = require('bedrock-protocol');

const CONFIG = {
    host: 'Soloraft.aternos.me',
    port: 27295,
    username: 'AFK_Bot',
    offline: true,
    reconnectInterval: 5000,
    moveInterval: 15000
};

let botClient = null;
let moveIntervalId = null;
let isConnecting = false;

function connectBot() {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`[LOG] Bot serverga ulanishga harakat qilmoqda: ${CONFIG.host}:${CONFIG.port}`);

    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }

    try {
        botClient = new Client({
            host: CONFIG.host,
            port: CONFIG.port,
            username: CONFIG.username,
            offline: CONFIG.offline
        });

        botClient.on('spawn', () => {
            console.log('[SUCCESS] Bot serverga muvaffaqiyatli kirdi va AFK rejimiga oʻtdi!');
            isConnecting = false;
            startAntiAfk();
        });

        botClient.on('error', (err) => {
            console.log('[ERROR] Botda xatolik yuz berdi:', err.message || err);
            isConnecting = false;
        });

        botClient.on('close', () => {
            console.log('[WARNING] Server bilan aloqa uzildi. Qayta ulanishga harakat qilinmoqda...');
            handleDisconnect();
        });

    } catch (error) {
        console.log('[CRITICAL] Klientni yaratishda xatolik:', error.message);
        handleDisconnect();
    }
}

function handleDisconnect() {
    isConnecting = false;
    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }
    
    setTimeout(() => {
        connectBot();
    }, CONFIG.reconnectInterval);
}

function startAntiAfk() {
    if (moveIntervalId) clearInterval(moveIntervalId);

    moveIntervalId = setInterval(() => {
        try {
            console.log('[ANTIAFK] Bot serverda faollik koʻrsatmoqda.');
        } catch (e) {
            console.log('[ANTIAFK ERROR]:', e.message);
        }
    }, CONFIG.moveInterval);
}

// Kutilmagan crash larning oldini olish
process.on('uncaughtException', (err) => {
    console.log('[FATAL ERROR Uncaught]:', err.message);
    handleDisconnect();
});

process.on('unhandledRejection', (reason) => {
    console.log('[FATAL ERROR Rejection]:', reason);
    handleDisconnect();
});

// Ishga tushirish
connectBot();
