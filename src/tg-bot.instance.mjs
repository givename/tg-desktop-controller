import TelegramBot from 'node-telegram-bot-api';
import { env } from './env.config.mjs';
import { getKeyboard } from './keyboard.manager.mjs';

// Создаем и экспортируем экземпляр бота с базовыми настройками
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

// Функция для отправки сообщения с клавиатурой
export async function sendMessageWithKeyboard(chatId, text, options = {}) {
  const keyboard = getKeyboard(chatId, options.forceKeyboard);
  const defaultOptions = {
    parse_mode: 'Markdown',
  };

  const mergedOptions = { ...defaultOptions, ...options };
  // Удаляем наш кастомный параметр перед отправкой
  delete mergedOptions.forceKeyboard;
  
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

// Функция для отправки фото с клавиатурой
export async function sendPhotoWithKeyboard(chatId, photo, options = {}) {
  const keyboard = getKeyboard(chatId, options.forceKeyboard);
  const mergedOptions = { ...options };
  delete mergedOptions.forceKeyboard;
  
  if (keyboard) {
    mergedOptions.reply_markup = keyboard;
  }

  return await bot.sendPhoto(chatId, photo, mergedOptions);
}

// Функция для отправки документа с клавиатурой
export async function sendDocumentWithKeyboard(chatId, document, options = {}) {
  const keyboard = getKeyboard(chatId, options.forceKeyboard);
  const mergedOptions = { ...options };
  delete mergedOptions.forceKeyboard;
  
  if (keyboard) {
    mergedOptions.reply_markup = keyboard;
  }

  return await bot.sendDocument(chatId, document, mergedOptions);
}
