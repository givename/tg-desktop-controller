import TelegramBot from 'node-telegram-bot-api';

import { env } from './env.config.mjs';
import { areKeyboardsEqual, sleep } from './utils.mjs';
import { CONSOLE_MESSAGES, DEFAULT_KEYBOARD } from './text.provider.mjs';

// Создаем бота с базовыми настройками
export const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// Экспортируем DEFAULT_KEYBOARD для совместимости
export { DEFAULT_KEYBOARD };

// Хранилище текущих клавиатур для каждого чата
const currentKeyboards = new Map();

// Функция для получения клавиатуры с проверкой необходимости обновления
export function getKeyboard(chatId) {
  const currentKeyboard = currentKeyboards.get(chatId);

  if (!areKeyboardsEqual(currentKeyboard, DEFAULT_KEYBOARD)) {
    currentKeyboards.set(chatId, DEFAULT_KEYBOARD);
    return DEFAULT_KEYBOARD;
  }

  return undefined;
}

// Функция для принудительной установки клавиатуры
export function setKeyboard(chatId) {
  currentKeyboards.set(chatId, DEFAULT_KEYBOARD);
}

// Функция для отправки сообщения с клавиатурой
export async function sendMessageWithKeyboard(chatId, text, options = {}) {
  const keyboard = getKeyboard(chatId);
  const defaultOptions = {
    parse_mode: 'Markdown',
  };

  const mergedOptions = { ...defaultOptions, ...options };
  if (keyboard) {
    mergedOptions.reply_markup = keyboard;
  }

  try {
    return await bot.sendMessage(chatId, text, mergedOptions);
  } catch (error) {
    // Если ошибка парсинга Markdown, отправляем как обычный текст
    if (error.message.includes("can't parse entities")) {
      console.warn('⚠️ Ошибка парсинга Markdown, отправка как обычный текст');
      const plainOptions = { ...mergedOptions };
      delete plainOptions.parse_mode;

      try {
        return await bot.sendMessage(chatId, text, plainOptions);
      } catch (secondError) {
        console.error('❌ Ошибка отправки сообщения:', secondError.message);
        throw secondError;
      }
    }
    throw error;
  }
}

// Простая функция перезапуска polling
async function restartPolling() {
  console.log('🔄 Перезапуск polling...');

  try {
    await bot.stopPolling();
    await sleep(2000);
    await bot.startPolling();
    console.log('✅ Polling перезапущен успешно');
  } catch (error) {
    console.error('❌ Ошибка перезапуска polling:', error.message);
    // Если не удается перезапустить, завершаем процесс для PM2
    setTimeout(() => process.exit(1), 5000);
  }
}

// Обработка ошибок polling - главная причина зависания после сна
bot.on('polling_error', (error) => {
  console.error('🔴 Ошибка polling:', error.message);

  // Список сетевых ошибок, которые требуют перезапуска
  const networkErrors = ['EFATAL', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];

  if (networkErrors.includes(error.code)) {
    console.log('🌐 Сетевая ошибка, перезапуск polling...');
    setTimeout(() => restartPolling(), 1000);
  }
});

// Обработка общих ошибок бота
bot.on('error', (error) => {
  console.error('🔴 Ошибка бота:', error.message);
});

// Простой heartbeat - проверяем соединение каждые 60 секунд
setInterval(async () => {
  try {
    await bot.getMe();
    console.log('💚 Heartbeat: соединение активно');
  } catch (error) {
    console.warn('⚠️ Heartbeat: проблема с соединением, перезапуск...');
    restartPolling();
  }
}, 60000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📡 Получен SIGINT, остановка бота...');
  try {
    await bot.stopPolling();
    console.log('✅ Бот остановлен');
  } catch (error) {
    console.error('❌ Ошибка при остановке:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📡 Получен SIGTERM, остановка бота...');
  try {
    await bot.stopPolling();
    console.log('✅ Бот остановлен');
  } catch (error) {
    console.error('❌ Ошибка при остановке:', error.message);
  }
  process.exit(0);
});

// Обработка критических ошибок
process.on('unhandledRejection', (reason) => {
  console.error('💥 Необработанная ошибка:', reason);

  // Если это сетевая ошибка, перезапускаем polling
  if (reason && reason.code && ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(reason.code)) {
    console.log('🌐 Сетевая ошибка, перезапуск...');
    setTimeout(() => restartPolling(), 2000);
  }
});

process.on('uncaughtException', (error) => {
  console.error('💀 Критическая ошибка:', error.message);

  // При критических ошибках завершаем процесс для PM2
  setTimeout(() => {
    console.log('🚨 Перезапуск процесса...');
    process.exit(1);
  }, 1000);
});

console.log('🚀 Telegram бот запущен');
console.log('💚 Автовосстановление после сна: включено');
console.log('🔄 Heartbeat проверка: каждые 60 секунд');
