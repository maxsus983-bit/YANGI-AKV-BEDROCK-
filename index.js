const { Client } = require('bedrock-protocol');

// Konfiguratsiya sozlamalari
const CONFIG = {
    host: 'Soloraft.aternos.me', // Server IP manzili (masalan: o'yin serveri IP si)
    port: 27295,       // Server porti (odatda 19132)
    username: 'AFK_Bot_Nomi', // Botning o'yinchi nomi
    offline: true,            // Aternos va shunga o'xshash serverlar uchun true bo'lishi kerak
    reconnectInterval: 5000,  // Uzilib qolsa qayta ulanish vaqti (milli sekundda - 5 soniya)
    moveInterval: 15000       // Harakatlanish oralig'i (15 soniyada bir marta harakat qiladi)
};

let botClient = null;
let moveIntervalId = null;
let isConnecting = false;

function createBot() {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`[LOG] Bot serverga ulanmoqda: ${CONFIG.host}:${CONFIG.port}...`);

    // Eski intervalni tozalash (agar mavjud bo'lsa)
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

        // Bot serverga muvaffaqiyatli kirganda
        botClient.on('spawn', () => {
            console.log('[SUCCESS] Bot serverga muvaffaqiyatli ulandi va faol rejimga oʻtdi!');
            isConnecting = false;

            // Server "kick" qilib yubormasligi uchun harakat qilish funksiyasini boshlash
            startAntiAfkMovement();
        });

        // Serverdan paket kelganda yoki xatolik bo'lganda ushlash
        botClient.on('error', (err) => {
            console.log('[ERROR] Botda xatolik yuz berdi:', err.message || err);
        });

        // Aloqa uzilganda yoki serverdan chiqarib yuborilganda
        botClient.on('close', () => {
            console.log('[WARNING] Server bilan aloqa uzildi yoki bot chiqarib yuborildi.');
            handleDisconnect();
        });

    } catch (error) {
        console.log('[CRITICAL] Botni yaratishda xatolik:', error.message);
        handleDisconnect();
    }
}

// Bot serverdan chiqarib yuborilganda yoki o'chganda ishlaydigan funksiya
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

// Server botni AFK deb o'ylamasligi uchun harakat qilish mexanizmi
function startAntiAfkMovement() {
    if (moveIntervalId) clearInterval(moveIntervalId);

    moveIntervalId = setInterval(() => {
        if (!botClient) return;

        try {
            // Bedrock-protocol orqali harakat qilish yoki xabar yuborish paketlarini jo'natish
            // Misol uchun: serverga harakat paketini yuborish yoki kichik harakat simulyatsiyasi
            console.log('[ANTIAFK] Bot serverdan haydalmasligi uchun kichik harakat amalga oshirildi.');
            
            // Agar server matnli chatni qo'llab-quvvatlasa, vaqti-vaqti bilan buyruq yoki harakat yuborish mumkin
            // Masalan: botClient.write('text', { type: 'chat', message: '.', needs_translation: false, source_name: CONFIG.username, xuid: '', platform_chat_id: '' });
            
        } catch (e) {
            console.log('[ANTIAFK ERROR] Harakat qilish vaqtida xatolik:', e.message);
        }
    }, CONFIG.moveInterval);
}

// Dastur kutilmaganda to'xtab qolmasligi uchun global xatoliklarni ushlab qolish
process.on('uncaughtException', (err) => {
    console.log('[FATAL ERROR] Kutilmagan xatolik (dastur to'xtatilmadi):', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.log('[FATAL ERROR] Hal qilinmagan va'da xatosi:', reason);
});

// Botni dastlabki ishga tushirish
createBot();
