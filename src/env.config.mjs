import dotenv from 'dotenv';
import os from 'os';

import { ENV_VALIDATION_MESSAGES } from './text.provider.mjs';

// Загружаем переменные окружения из файла .env
dotenv.config();

// Список обязательных переменных для всех платформ
const REQUIRED_VARS = ['TELEGRAM_BOT_TOKEN', 'AUTHORIZED_USER_ID'];

// Linux-специфичные обязательные переменные
const LINUX_REQUIRED_VARS = ['LINUX_USER_ID', 'LINUX_USER_NAME'];

// Функция валидации переменных окружения
export function validateEnv() {
  const missing = [];
  const isLinux = os.platform() === 'linux';

  // Проверяем обязательные переменные для всех платформ
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Проверяем Linux-специфичные переменные только на Linux
  if (isLinux) {
    for (const varName of LINUX_REQUIRED_VARS) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  if (missing.length > 0) {
    console.error(ENV_VALIDATION_MESSAGES.MISSING_REQUIRED_VARS);
    missing.forEach((varName) => {
      if (LINUX_REQUIRED_VARS.includes(varName)) {
        console.error(`   - ${varName} (требуется только на Linux)`);
      } else {
        console.error(`   - ${varName}`);
      }
    });
    console.error(ENV_VALIDATION_MESSAGES.CREATE_ENV_FILE);
    process.exit(1);
  }

  // Выводим информацию о платформе
  console.log(`🖥️ Платформа: ${os.platform()}`);
  if (isLinux) {
    console.log(`👤 Linux пользователь: ${env.LINUX_USER_NAME} (ID: ${env.LINUX_USER_ID})`);
  }
  if (env.STORAGE_PATH) {
    console.log(`📁 Путь для файлов: ${env.STORAGE_PATH}`);
  } else {
    console.log(`📁 Сохранение файлов отключено (STORAGE_PATH не указан)`);
  }

  console.log(ENV_VALIDATION_MESSAGES.VALIDATION_SUCCESS);
}

// Экспортируем объект с переменными окружения
export const env = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  AUTHORIZED_USER_ID: process.env.AUTHORIZED_USER_ID,
  LINUX_USER_ID: process.env.LINUX_USER_ID || null,
  LINUX_USER_NAME: process.env.LINUX_USER_NAME || null,
  STORAGE_PATH: process.env.STORAGE_PATH || null,
};

// Функция проверки авторизации пользователя
export function isAuthorized(userId) {
  return userId.toString() === env.AUTHORIZED_USER_ID;
}
