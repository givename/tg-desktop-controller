import { bot, sendMessageWithKeyboard } from './tg-bot.instance.mjs';
import { setKeyboard } from './keyboard.manager.mjs';
import { isAuthorized } from './env.config.mjs';
import { isMessageTooOld, sleep } from './utils.mjs';
import { createReadStream } from 'fs';
import * as osController from './os.controller.mjs';
import {
  HELP_TEXT,
  WELCOME_MESSAGE,
  ERRORS,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  CONFIRMATION_TEMPLATE,
  PONG_TEMPLATE,
  CONSOLE_MESSAGES,
  KEYBOARD_BUTTONS,
  ERROR_LOG_MESSAGES,
  HELP_MESSAGE_TITLE,
} from './text.provider.mjs';
import {
  createConfirmationCode,
  validateConfirmationCode,
  hasActiveCode,
} from './confirmation.manager.mjs';

// Функция для обработки кнопок клавиатуры
async function handleKeyboardButtons(chatId, text, userId) {
  try {
    switch (text) {
      case KEYBOARD_BUTTONS.SOUND_ON:
        const soundOnResult = await osController.soundOn();
        await sendMessageWithKeyboard(chatId, soundOnResult.message);
        break;

      case KEYBOARD_BUTTONS.SOUND_OFF:
        const soundOffResult = await osController.soundOff();
        await sendMessageWithKeyboard(chatId, soundOffResult.message);
        break;

      case KEYBOARD_BUTTONS.MICROPHONE_ON:
        const micOnResult = await osController.microphoneOn();
        await sendMessageWithKeyboard(chatId, micOnResult.message);
        break;

      case KEYBOARD_BUTTONS.MICROPHONE_OFF:
        const micOffResult = await osController.microphoneOff();
        await sendMessageWithKeyboard(chatId, micOffResult.message);
        break;

      case KEYBOARD_BUTTONS.PLAY:
        const playResult = await osController.playAudio();
        await sendMessageWithKeyboard(chatId, playResult.message);
        break;

      case KEYBOARD_BUTTONS.PAUSE:
        const pauseResult = await osController.pauseAudio();
        await sendMessageWithKeyboard(chatId, pauseResult.message);
        break;

      case KEYBOARD_BUTTONS.PREV_TRACK:
        const prevResult = await osController.previousTrack();
        await sendMessageWithKeyboard(chatId, prevResult.message);
        break;

      case KEYBOARD_BUTTONS.NEXT_TRACK:
        const nextResult = await osController.nextTrack();
        await sendMessageWithKeyboard(chatId, nextResult.message);
        break;

      case KEYBOARD_BUTTONS.VOLUME_DOWN:
        const volumeDownResult = await osController.volumeDown();
        await sendMessageWithKeyboard(chatId, volumeDownResult.message);
        break;

      case KEYBOARD_BUTTONS.VOLUME_UP:
        const volumeUpResult = await osController.volumeUp();
        await sendMessageWithKeyboard(chatId, volumeUpResult.message);
        break;

      case KEYBOARD_BUTTONS.DISPLAY_OFF:
        const displayResult = await osController.displayOff();
        await sendMessageWithKeyboard(chatId, displayResult.message);
        break;

      case KEYBOARD_BUTTONS.REBOOT:
        await handleRebootButton(chatId, userId);
        break;

      case KEYBOARD_BUTTONS.SUSPEND:
        await handleSuspendButton(chatId, userId);
        break;

      case KEYBOARD_BUTTONS.PING:
        const startTime = Date.now();
        setTimeout(async () => {
          const responseTime = Date.now() - startTime;
          await sendMessageWithKeyboard(chatId, PONG_TEMPLATE(responseTime));
        }, 10);
        break;

      case KEYBOARD_BUTTONS.INFO:
        await handleInfoButton(chatId);
        break;

      case KEYBOARD_BUTTONS.UPTIME:
        await handleUptimeButton(chatId);
        break;

      case KEYBOARD_BUTTONS.SCREENSHOT:
        await handleScreenshotButton(chatId);
        break;

      case KEYBOARD_BUTTONS.HELP:
        const helpMessage = `${HELP_MESSAGE_TITLE}\n\n${HELP_TEXT}`;
        await sendMessageWithKeyboard(chatId, helpMessage);
        break;
    }
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.KEYBOARD_BUTTON_PROCESSING, error);
  }
}

async function handleRebootButton(chatId, userId) {
  try {
    const rebootCode = createConfirmationCode(userId, chatId, 'reboot');

    const message = CONFIRMATION_TEMPLATE(
      INFO_MESSAGES.REBOOT_CONFIRMATION,
      rebootCode,
      INFO_MESSAGES.COMPUTER_WILL_REBOOT,
      INFO_MESSAGES.CODE_VALID_TIME
    );
    await sendMessageWithKeyboard(chatId, message);
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.REBOOT_BUTTON_HANDLER, error);
  }
}

async function handleSuspendButton(chatId, userId) {
  try {
    const code = createConfirmationCode(userId, chatId, 'suspend');

    const message = CONFIRMATION_TEMPLATE(
      INFO_MESSAGES.SUSPEND_CONFIRMATION,
      code,
      INFO_MESSAGES.COMPUTER_WILL_SUSPEND,
      INFO_MESSAGES.CODE_VALID_TIME
    );
    await sendMessageWithKeyboard(chatId, message);
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.SUSPEND_BUTTON_HANDLER, error);
  }
}

async function handleInfoButton(chatId) {
  try {
    await sendMessageWithKeyboard(chatId, INFO_MESSAGES.GETTING_SYSTEM_INFO);

    const info = await osController.getSystemInfo();
    await sendMessageWithKeyboard(chatId, info);
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.INFO_BUTTON_HANDLER, error);
    await sendMessageWithKeyboard(chatId, ERRORS.SYSTEM_INFO_ERROR);
  }
}

async function handleUptimeButton(chatId) {
  try {
    const uptime = await osController.getUptime();
    await sendMessageWithKeyboard(chatId, uptime);
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.UPTIME_BUTTON_HANDLER, error);
    await sendMessageWithKeyboard(chatId, '❌ Ошибка получения uptime');
  }
}

async function handleScreenshotButton(chatId) {
  try {
    const result = await osController.takeScreenshots();
    if (result.success) {
      const filepaths = [];

      // Отправляем каждый скриншот отдельно
      for (const screenshot of result.screenshots) {
        try {
          const filepath = screenshot.filepath.trim();
          const stream = createReadStream(filepath);
          await bot.sendPhoto(chatId, stream, {
            caption: screenshot.caption,
          });
          filepaths.push(filepath);
        } catch (err) {
          console.error('Error sending screenshot:', err);
          await sendMessageWithKeyboard(chatId, `${ERRORS.SCREENSHOT_SEND_ERROR}: ${err.message}`);
        }
      }

      // Удаляем временные файлы через osController
      await osController.cleanupTempFiles(filepaths);
    } else {
      await sendMessageWithKeyboard(chatId, `${ERRORS.SCREENSHOT_SEND_ERROR}: ${result.error}`);
    }
  } catch (error) {
    console.error(ERROR_LOG_MESSAGES.SCREENSHOT_BUTTON_HANDLER, error);
    await sendMessageWithKeyboard(chatId, `${ERRORS.SCREENSHOT_SEND_ERROR}: ${error.message}`);
  }
}

export function setupBotLogic(bot) {
  // Команда /start
  bot.onText(/\/start/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      // Игнорируем устаревшие сообщения
      if (isMessageTooOld(msg)) return;

      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS, { forceKeyboard: true });
        return;
      }

      // Принудительно устанавливаем клавиатуру при старте
      setKeyboard(chatId, true);
      await sendMessageWithKeyboard(chatId, WELCOME_MESSAGE, { forceKeyboard: true });
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_START, error);
    }
  });

  // Команда /help
  bot.onText(/\/help/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      // Игнорируем устаревшие сообщения
      if (isMessageTooOld(msg)) return;

      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS, { forceKeyboard: true });
        return;
      }

      const helpMessage = `${HELP_MESSAGE_TITLE}\n\n${HELP_TEXT}`;
      // Также принудительно устанавливаем клавиатуру при /help
      await sendMessageWithKeyboard(chatId, helpMessage, { forceKeyboard: true });
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_HELP, error);
    }
  });

  // Команда /keyboard - для принудительного восстановления клавиатуры
  bot.onText(/\/keyboard/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      // Игнорируем устаревшие сообщения
      if (isMessageTooOld(msg)) return;

      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS, { forceKeyboard: true });
        return;
      }

      // Принудительно восстанавливаем клавиатуру
      setKeyboard(chatId, true);
      await sendMessageWithKeyboard(chatId, '⌨️ Клавиатура восстановлена!', {
        forceKeyboard: true,
      });
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_HELP, error);
    }
  });

  // Команды звука
  bot.onText(/\/soundon/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.soundOn();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_SOUNDON, error);
    }
  });

  bot.onText(/\/soundoff/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.soundOff();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_SOUNDOFF, error);
    }
  });

  // Команды воспроизведения
  bot.onText(/\/play/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.playAudio();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_PLAY, error);
    }
  });

  bot.onText(/\/pause/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.pauseAudio();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_PAUSE, error);
    }
  });

  bot.onText(/\/next/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.nextTrack();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_NEXT, error);
    }
  });

  bot.onText(/\/prev/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.previousTrack();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_PREV, error);
    }
  });

  // Команды громкости
  bot.onText(/\/volume_up/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.volumeUp();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_VOLUME_UP, error);
    }
  });

  bot.onText(/\/volume_down/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.volumeDown();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_VOLUME_DOWN, error);
    }
  });

  // Команды микрофона
  bot.onText(/\/microphoneon/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.microphoneOn();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_MICROPHONEON, error);
    }
  });

  bot.onText(/\/microphoneoff/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.microphoneOff();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_MICROPHONEOFF, error);
    }
  });

  // Системные команды
  bot.onText(/\/displayoff/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const result = await osController.displayOff();
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_DISPLAYOFF, error);
    }
  });

  // Команды с подтверждением
  bot.onText(/\/suspend/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      await handleSuspendButton(chatId, userId);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_SUSPEND, error);
    }
  });

  bot.onText(/\/reboot/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      await handleRebootButton(chatId, userId);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_REBOOT, error);
    }
  });

  // Команда /ping
  bot.onText(/\/ping/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const startTime = Date.now();
      setTimeout(async () => {
        const responseTime = Date.now() - startTime;
        await sendMessageWithKeyboard(chatId, PONG_TEMPLATE(responseTime));
      }, 10);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_PING, error);
    }
  });

  // Команда /info
  bot.onText(/\/info/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      await sendMessageWithKeyboard(chatId, INFO_MESSAGES.GETTING_SYSTEM_INFO);

      try {
        const info = await osController.getSystemInfo();
        await sendMessageWithKeyboard(chatId, info);
      } catch (error) {
        await sendMessageWithKeyboard(chatId, ERRORS.SYSTEM_INFO_ERROR);
      }
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_INFO, error);
    }
  });

  // Команда /uptime
  bot.onText(/\/uptime/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const uptime = await osController.getUptime();
      await sendMessageWithKeyboard(chatId, uptime);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_UPTIME, error);
      await sendMessageWithKeyboard(chatId, '❌ Ошибка получения uptime');
    }
  });

  // Команда /screenshot
  bot.onText(/\/screenshot/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      await handleScreenshotButton(chatId);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.COMMAND_SCREENSHOT, error);
    }
  });

  // Обработка файлов
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isMessageTooOld(msg)) return;
    if (!isAuthorized(userId)) {
      await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
      return;
    }

    try {
      // Берем самую большую версию фото
      const photo = msg.photo[msg.photo.length - 1];
      const result = await osController.savePhoto(bot, photo);
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(CONSOLE_MESSAGES.FILE_PROCESSING_ERROR_LOG(error));
      await sendMessageWithKeyboard(chatId, ERRORS.PHOTO_PROCESSING_ERROR);
    }
  });

  bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isMessageTooOld(msg)) return;
    if (!isAuthorized(userId)) {
      await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
      return;
    }

    try {
      const result = await osController.saveDocument(bot, msg.document);
      await sendMessageWithKeyboard(chatId, result.message);
    } catch (error) {
      console.error(CONSOLE_MESSAGES.DOCUMENT_PROCESSING_ERROR_LOG(error));
      await sendMessageWithKeyboard(chatId, ERRORS.FILE_PROCESSING_ERROR);
    }
  });

  // Обработка всех текстовых сообщений (для кодов подтверждения и кнопок)
  bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (isMessageTooOld(msg)) return;
      if (!isAuthorized(userId)) {
        await sendMessageWithKeyboard(chatId, ERRORS.NO_ACCESS);
        return;
      }

      const text = msg.text;

      // Проверяем, если это код подтверждения для suspend или reboot
      if (hasActiveCode(userId) && text && text.match(/^\d{4}$/)) {
        const validationResult = validateConfirmationCode(userId, text);

        if (validationResult.valid) {
          const savedData = validationResult.data;

          if (savedData.action === 'reboot') {
            await sendMessageWithKeyboard(
              chatId,
              `${SUCCESS_MESSAGES.CONFIRMATION_ACCEPTED} ${INFO_MESSAGES.REBOOTING_COMPUTER}`
            );
            const result = await osController.rebootSystem();
            if (!result.success) {
              await sendMessageWithKeyboard(chatId, result.message);
            }
          } else {
            await sendMessageWithKeyboard(
              chatId,
              `${SUCCESS_MESSAGES.CONFIRMATION_ACCEPTED} ${INFO_MESSAGES.SUSPENDING_COMPUTER}`
            );
            const result = await osController.suspendSystem();
            if (!result.success) {
              await sendMessageWithKeyboard(chatId, result.message);
            }
          }
        } else {
          await sendMessageWithKeyboard(chatId, ERRORS.INVALID_CONFIRMATION_CODE);
        }
        return;
      }

      // Обработка нажатий кнопок клавиатуры
      await handleKeyboardButtons(chatId, text, userId);
    } catch (error) {
      console.error(ERROR_LOG_MESSAGES.MESSAGE_PROCESSING, error);
    }
  });
}

// Функции инициализации и управления ботом
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

// Функция инициализации всех хуков и обработчиков бота
export function initializeBotHooks() {
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
}
