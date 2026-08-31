const bedrock = require('bedrock-protocol');


// ============================================================
//                    CONFIGURATION
// ============================================================

const CONFIG = {

  // Minecraft server
  HOST: 'Soloraft.aternos.me',
  PORT_MC: 27295,

  // Bot
  USERNAME: 'AKV_Bot',

  // Minecraft Bedrock version
  VERSION: '1.26.30',

  // Qayta ulanish oralig'i
  RECONNECT_DELAY: 5000,

  // Anti-AFK
  ANTI_AFK_INTERVAL: 15000,

  // Serverga ulanganligini tekshirish
  WATCHDOG_INTERVAL: 30000,

  // Ulanish urinishi haqida log
  LOG_CONNECTION: true

};


// ============================================================
//                    GLOBAL HOLATLAR
// ============================================================

let currentClient = null;

let reconnectTimer = null;

let watchdogTimer = null;

let antiAfkTimer = null;

let reconnectScheduled = false;

let botConnected = false;

let botSpawned = false;

let shuttingDown = false;

let runtimeId = null;

let botPosition = {
  x: 0,
  y: 0,
  z: 0
};

let botRotation = {
  yaw: 0,
  pitch: 0,
  headYaw: 0
};

let movementTick = 0;


// ============================================================
//                         WAIT
// ============================================================

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================
//                     LOG FUNKSIYALARI
// ============================================================

function log(message) {
  console.log(`[AKV] ${message}`);
}

function logError(message, error) {

  console.error(`[AKV ERROR] ${message}`);

  if (error) {
    console.error(error);
  }

}


// ============================================================
//                RECONNECT TIMERNI TOZALASH
// ============================================================

function clearReconnectTimer() {

  if (reconnectTimer) {

    clearTimeout(reconnectTimer);

    reconnectTimer = null;

  }

  reconnectScheduled = false;

}


// ============================================================
//                   ANTI-AFKNI TOZALASH
// ============================================================

function stopAntiAfk() {

  if (antiAfkTimer) {

    clearInterval(antiAfkTimer);

    antiAfkTimer = null;

  }

}


// ============================================================
//                    WATCHDOGNI TOZALASH
// ============================================================

function stopWatchdog() {

  if (watchdogTimer) {

    clearInterval(watchdogTimer);

    watchdogTimer = null;

  }

}


// ============================================================
//                  BARCHA TIMERLARNI TOZALASH
// ============================================================

function clearBotTimers() {

  stopAntiAfk();

  stopWatchdog();

}


// ============================================================
//                     RECONNECT REJIMI
// ============================================================

function retryConnection(reason = 'Aloqa uzildi') {

  if (shuttingDown) {
    return;
  }

  if (reconnectScheduled) {
    return;
  }

  reconnectScheduled = true;

  log(`${reason}`);

  log(
    `${CONFIG.RECONNECT_DELAY / 1000} soniyadan keyin qayta ulanishga uriniladi...`
  );

  reconnectTimer = setTimeout(() => {

    reconnectTimer = null;

    reconnectScheduled = false;

    startBot();

  }, CONFIG.RECONNECT_DELAY);

}


// ============================================================
//                    ANTI-AFK HARAKATI
// ============================================================
//
// Bu funksiya botning uzoq vaqt butunlay harakatsiz qolib,
// AFK timeout sabab chiqarib yuborilish ehtimolini kamaytiradi.
//
// Bot juda katta masofaga yurmaydi.
// Faqat kichik harakat/rotatsiya qiladi.
// ============================================================

function startAntiAfkMovement(client) {

  stopAntiAfk();

  antiAfkTimer = setInterval(() => {

    try {

      if (!client) {
        return;
      }

      if (!botConnected) {
        return;
      }

      if (!botSpawned) {
        return;
      }

      if (runtimeId === null || runtimeId === undefined) {
        return;
      }


      // Har safar yo'nalishni ozgina o'zgartiramiz.
      // Juda katta harakat qilmaydi.

      botRotation.yaw += 20;

      if (botRotation.yaw >= 360) {
        botRotation.yaw -= 360;
      }


      // Kichik oldinga harakat

      const radians =
        botRotation.yaw * Math.PI / 180;

      const smallMove = 0.15;

      botPosition.x += Math.sin(radians) * smallMove;

      botPosition.z += Math.cos(radians) * smallMove;


      // ========================================================
      // MOVE_PLAYER
      // ========================================================

      try {

        client.queue('move_player', {

          runtime_entity_id: runtimeId,

          position: {
            x: botPosition.x,
            y: botPosition.y,
            z: botPosition.z
          },

          pitch: botRotation.pitch,

          yaw: botRotation.yaw,

          head_yaw: botRotation.headYaw,

          mode: 0,

          on_ground: true,

          ridden_runtime_id: 0,

          tick: movementTick++

        });

      } catch (movementError) {

        logError(
          'Anti-AFK movement packet yuborishda xatolik',
          movementError
        );

      }


      log(
        `Anti-AFK: kichik harakat amalga oshirildi.`
      );


    } catch (error) {

      logError(
        'Anti-AFK ichida kutilmagan xatolik',
        error
      );

    }

  }, CONFIG.ANTI_AFK_INTERVAL);

}


// ============================================================
//                  WATCHDOG / CONNECTION MONITOR
// ============================================================

function startWatchdog(client) {

  stopWatchdog();

  watchdogTimer = setInterval(() => {

    try {

      if (!client) {
        return;
      }

      if (!botConnected) {
        return;
      }

      /*
       * Bu yerda botning processini qayta ishga tushirmaymiz.
       * Faqat holatini kuzatamiz.
       */

      if (CONFIG.LOG_CONNECTION) {

        log(
          `Watchdog: bot online | ` +
          `${CONFIG.HOST}:${CONFIG.PORT_MC}`
        );

      }

    } catch (error) {

      logError(
        'Watchdog xatoligi',
        error
      );

    }

  }, CONFIG.WATCHDOG_INTERVAL);

}


// ============================================================
//                       BOT START
// ============================================================

function startBot() {

  if (shuttingDown) {
    return;
  }


  // Eski reconnect timer bo'lsa tozalaymiz

  clearReconnectTimer();


  // Eski timerlarni tozalaymiz

  clearBotTimers();


  botConnected = false;

  botSpawned = false;

  runtimeId = null;

  movementTick = 0;


  log(
    `${CONFIG.HOST}:${CONFIG.PORT_MC} manziliga ulanishga harakat qilinmoqda...`
  );


  let client;


  // ==========================================================
  //                     CREATE CLIENT
  // ==========================================================

  try {

    client = bedrock.createClient({

      host: CONFIG.HOST,

      port: CONFIG.PORT_MC,

      username: CONFIG.USERNAME,

      offline: true,

      version: CONFIG.VERSION

    });

    currentClient = client;

  } catch (err) {

    logError(
      'Ulanishni yaratishda xatolik',
      err
    );

    retryConnection(
      'Client yaratilmadi.'
    );

    return;

  }


  // ==========================================================
  //                     CONNECT EVENT
  // ==========================================================

  client.on('connect', () => {

    log(
      'TCP/RakNet ulanish jarayoni boshlandi.'
    );

  });


  // ==========================================================
  //                       LOGIN EVENT
  // ==========================================================

  client.on('login', () => {

    log(
      'Bot login bosqichidan muvaffaqiyatli o‘tdi.'
    );

  });


  // ==========================================================
  //                        JOIN EVENT
  // ==========================================================

  client.on('join', () => {

    log(
      'Bot serverga join qildi.'
    );

  });


  // ==========================================================
  //                       SPAWN EVENT
  // ==========================================================

  client.on('spawn', () => {

    botConnected = true;

    botSpawned = true;

    reconnectScheduled = false;


    log(
      'Bot serverga muvaffaqiyatli kirdi.'
    );

    log(
      'Anti-AFK rejimi ishga tushirildi.'
    );


    // --------------------------------------------------------
    // Server bergan runtime ID ni olishga harakat
    // --------------------------------------------------------

    try {

      if (
        client.startGameData &&
        client.startGameData.runtime_entity_id !== undefined
      ) {

        runtimeId =
          client.startGameData.runtime_entity_id;

      }

    } catch (error) {

      logError(
        'Runtime ID olishda xatolik',
        error
      );

    }


    // --------------------------------------------------------
    // Boshlang'ich pozitsiyani olish
    // --------------------------------------------------------

    try {

      if (
        client.startGameData &&
        client.startGameData.player_position
      ) {

        botPosition = {
          x: client.startGameData.player_position.x || 0,
          y: client.startGameData.player_position.y || 0,
          z: client.startGameData.player_position.z || 0
        };

      }

    } catch (error) {

      logError(
        'Boshlang‘ich pozitsiyani olishda xatolik',
        error
      );

    }


    startAntiAfkMovement(client);

    startWatchdog(client);

  });


  // ==========================================================
  //                 SERVER MOVEMENT PACKET
  // ==========================================================
  //
  // Server botni teleport qilsa yoki koordinatasini
  // o'zgartirsa, bot eski koordinatada qolib ketmasligi
  // uchun pozitsiyani yangilaymiz.
  // ==========================================================

  client.on('move_player', (packet) => {

    try {

      if (!packet) {
        return;
      }


      // Runtime ID

      if (
        runtimeId === null ||
        runtimeId === undefined
      ) {

        if (
          packet.runtime_entity_id !== undefined
        ) {

          runtimeId =
            packet.runtime_entity_id;

        }

      }


      // Pozitsiya

      if (packet.position) {

        botPosition = {

          x: Number(packet.position.x) || 0,

          y: Number(packet.position.y) || 0,

          z: Number(packet.position.z) || 0

        };

      }


      // Rotation

      if (packet.yaw !== undefined) {

        botRotation.yaw =
          Number(packet.yaw) || 0;

      }

      if (packet.pitch !== undefined) {

        botRotation.pitch =
          Number(packet.pitch) || 0;

      }

      if (packet.head_yaw !== undefined) {

        botRotation.headYaw =
          Number(packet.head_yaw) || 0;

      }


    } catch (error) {

      logError(
        'move_player packetini qayta ishlashda xatolik',
        error
      );

    }

  });


  // ==========================================================
  //                         ERROR
  // ==========================================================

  client.on('error', (err) => {

    logError(
      'Client xatoligi',
      err
    );

    /*
     * Error eventning o'zi processni o'chirib yubormasligi uchun
     * reconnectni shu yerda ham rejalashtiramiz.
     */

    if (!shuttingDown) {

      retryConnection(
        'Client error sababli aloqa muammosi.'
      );

    }

  });


  // ==========================================================
  //                         CLOSE
  // ==========================================================

  client.on('close', () => {

    botConnected = false;

    botSpawned = false;

    runtimeId = null;


    // Anti-AFK va watchdogni to'xtatamiz

    clearBotTimers();


    if (shuttingDown) {
      return;
    }


    log(
      '[-] Server bilan aloqa yopildi.'
    );


    /*
     * Server o'chgan bo'lishi mumkin.
     * Internet uzilgan bo'lishi mumkin.
     * Bot disconnect qilingan bo'lishi mumkin.
     *
     * Barcha holatlarda 5 soniyadan keyin qayta
     * ulanishga uriniladi.
     */

    retryConnection(
      'Connection closed.'
    );

  });


  // ==========================================================
  //                    END / DISCONNECT
  // ==========================================================

  client.on('end', () => {

    botConnected = false;

    botSpawned = false;

    runtimeId = null;

    clearBotTimers();


    if (!shuttingDown) {

      retryConnection(
        'Connection ended.'
      );

    }

  });


  // ==========================================================
  //                UNHANDLED CLIENT EVENTS
  // ==========================================================

  try {

    client.on('kick', (reason) => {

      log(
        `Bot server tomonidan chiqarildi: ${reason || 'sababi ko‘rsatilmagan'}`
      );

      botConnected = false;

      botSpawned = false;

      runtimeId = null;

      clearBotTimers();

      retryConnection(
        'Server disconnect/kick hodisasi.'
      );

    });

  } catch (error) {

    /*
     * Ayrim bedrock-protocol versiyalarida kick event
     * mavjud bo'lmasligi mumkin.
     *
     * Bu xatolik botni to'xtatmasligi kerak.
     */

    logError(
      'Kick event o‘rnatilmadi',
      error
    );

  }

}


// ============================================================
//                     CRASH GUARD
// ============================================================
//
// Kutilmagan JavaScript xatoligi processni birdaniga
// yopib yubormasligi uchun.
// ============================================================

process.on('uncaughtException', (error) => {

  console.error('');
  console.error('==============================================');
  console.error('        AKV BOT CRASH GUARD');
  console.error('==============================================');

  console.error(
    'Kutilmagan xatolik:',
    error
  );

  console.error(
    'Bot processi ishlashda davom etishga harakat qiladi.'
  );

  console.error('==============================================');
  console.error('');


  /*
   * Agar client o'lib qolgan bo'lsa,
   * reconnect mexanizmini ishga tushiramiz.
   */

  if (!shuttingDown) {

    retryConnection(
      'uncaughtException.'
    );

  }

});


// ============================================================
//                  UNHANDLED PROMISE GUARD
// ============================================================

process.on('unhandledRejection', (reason) => {

  console.error('');
  console.error('==============================================');
  console.error('      AKV PROMISE CRASH GUARD');
  console.error('==============================================');

  console.error(
    'Unhandled Promise Rejection:',
    reason
  );

  console.error(
    'Bot ishlashni davom ettirishga harakat qiladi.'
  );

  console.error('==============================================');
  console.error('');


  if (!shuttingDown) {

    retryConnection(
      'unhandledRejection.'
    );

  }

});


// ============================================================
//                    PROCESS SIGNALS
// ============================================================
//
// Foydalanuvchi botni ataylab to'xtatsa,
// reconnect loopni davom ettirmaymiz.
// ============================================================

process.on('SIGINT', () => {

  log(
    'Bot qo‘lda to‘xtatilmoqda...'
  );

  shuttingDown = true;

  clearReconnectTimer();

  clearBotTimers();


  try {

    if (currentClient) {

      currentClient.close();

    }

  } catch (error) {

    logError(
      'Clientni yopishda xatolik',
      error
    );

  }

  process.exit(0);

});


process.on('SIGTERM', () => {

  log(
    'SIGTERM qabul qilindi. Bot to‘xtatilmoqda...'
  );

  shuttingDown = true;

  clearReconnectTimer();

  clearBotTimers();


  try {

    if (currentClient) {

      currentClient.close();

    }

  } catch (error) {

    logError(
      'Clientni yopishda xatolik',
      error
    );

  }

  process.exit(0);

});


// ============================================================
//                     BOTNI ISHGA TUSHIRISH
// ============================================================

log('==============================================');

log('             AKV BEDROCK BOT');

log('==============================================');

log(`Server: ${CONFIG.HOST}:${CONFIG.PORT_MC}`);

log(`Username: ${CONFIG.USERNAME}`);

log(`Version: ${CONFIG.VERSION}`);

log(
  `Reconnect: ${CONFIG.RECONNECT_DELAY / 1000}s`
);

log(
  `Anti-AFK: ${CONFIG.ANTI_AFK_INTERVAL / 1000}s`
);

log('==============================================');


startBot();