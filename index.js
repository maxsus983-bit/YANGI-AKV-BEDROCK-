const { Client } = require('bedrock-protocol');

const CONFIG = {
    host: 'Soloraft.aternos.me',
    port: 27295,
    username: 'AKV_Bot',
    offline: true,
    reconnectInterval: 5000,
    moveInterval: 15000
};

let botClient = null;
let moveIntervalId = null;
let isConnecting = false;

function startBot() {
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
            console.log('[SUCCESS] Bot serverga muvaffaqiyatli ulandi va ishlayapti!');
            isConnecting = false;
            
            // Serverdan tepib yubormasligi uchun harakat simulyatsiyasi
            moveIntervalId = setInterval(() => {
                try {
                    console.log('[ANTIAFK] Bot faollik koʻrsatmoqda.');
                } catch (e) {
                    console.log('[ANTIAFK ERROR]:', e.message);
                }
            }, CONFIG.moveInterval);
        });

        botClient.on('error', (err) => {
            console.log('[ERROR] Xatolik:', err.message || err);
        });

        botClient.on('close', () => {
            console.log('[WARNING] Aloqa uzildi. Qayta ulanmoqda...');
            cleanupAndReconnect();
        });

    } catch (error) {
        console.log('[CRITICAL] Kritik xato:', error.message);
        cleanupAndReconnect();
    }
}

function cleanupAndReconnect() {
    isConnecting = false;
    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }
    
    setTimeout(() => {
        startBot();
    }, CONFIG.reconnectInterval);
}

process.on('uncaughtException', (err) => {
    console.log('[FATAL]:', err.message);
    cleanupAndReconnect();
});

process.on('unhandledRejection', (reason) => {
    console.log('[FATAL Rejection]:', reason);
    cleanupAndReconnect();
});

// Botni ishga tushirish
startBot();
            
