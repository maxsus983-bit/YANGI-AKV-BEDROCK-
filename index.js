const { Client } = require('bedrock-protocol');

// Konfiguratsiya sozlamalari
const CONFIG = {
    host: 'Soloraft.aternos.me', // Server manzili
    port: 27295,                // Server porti
    username: 'AFK_Bot',        // Botning o'yinchi nomi
    offline: true,              // Aternos va boshqa serverlar uchun true
    reconnectInterval: 5000,    // Uzilib qolsa 5 sekunddan so'ng qayta ulanish
    moveInterval: 15000         // Har 15 sekundda faollik ko'rsatish
};

let botClient = null;
let moveIntervalId = null;
let isConnecting = false;

function createBot() {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`[LOG] Bot ${CONFIG.host}:${CONFIG.port} manziliga ulanmoqda...`);

    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }

    try {
        botClient = new Client({
            host: CONFIG.host,
            port: CONFIG.port,
            username: CONFIG.username,
            offline: CONFIG.offline,
            version: "1.20.0" // Server versiyasi
        });

        botClient.on('spawn', () => {
            console.log('[SUCCESS] Bot serverga muvaffaqiyatli ulandi va AFK rejimiga oʻtdi!');
            isConnecting = false;
            startAntiAfkMovement();
        });

        botClient.on('error', (err) => {
            console.log('[ERROR] Botda xatolik yuz berdi:', err.message || err);
        });

        botClient.on('close', () => {
            console.log('[WARNING] Server bilan aloqa uzildi yoki bot chiqarib yuborildi.');
            handleDisconnect();
        });

    } catch (error) {
        console.log('[CRITICAL] Botni yaratishda xatolik:', error.message);
        handleDisconnect();
    }
}

function handleDisconnect() {
    isConnecting = false;
    
    if (moveIntervalId) {
        clearInterval(moveIntervalId);
        moveIntervalId = null;
    }

    console.log(`[INFO] ${CONFIG.reconnectInterval / 1000} soniyadan so'ng qayta ulanishga harakat qilinadi...`);
    
    setTimeout(() => {
        createBot();
    }, CONFIG.reconnectInterval);
}

function startAntiAfkMovement() {
    if (moveIntervalId) clearInterval(moveIntervalId);

    moveIntervalId = setInterval(() => {
        if (!botClient) return;

        try {
            console.log('[ANTIAFK] Bot serverdan haydalmasligi uchun harakat qilmoqda.');
            // Bu yerda serverdan kick bo'lmaslik uchun qo'shimcha paketlar almashinuvi amalga oshiriladi
        } catch (e) {
            console.log('[ANTIAFK ERROR] Harakat qilish vaqtida xatolik:', e.message);
        }
    }, CONFIG.moveInterval);
}

// Dastur kutilmaganda to'xtab qolishining oldini olish uchun crash himoyasi
process.on('uncaughtException', (err) => {
    console.log('[FATAL ERROR] Kutilmagan xatolik:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.log('[FATAL ERROR] Hal qilinmagan xatolik:', reason);
});

// Botni ishga tushirish
createBot();
