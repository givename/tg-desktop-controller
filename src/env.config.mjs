import dotenv from 'dotenv';

import { ENV_VALIDATION_MESSAGES } from './text.provider.mjs';

// Загружаем переменные окружения из файла .env
dotenv.config();

// Список обязательных переменных
const REQUIRED_VARS = [
  'TELEGRAM_BOT_TOKEN',
  'AUTHORIZED_USER_ID',
  'USER_ID',
  'USER_NAME',
  'STORAGE_PATH',
];

// Функция валидации переменных окружения
export function validateEnv() {
  const missing = [];

  // Проверяем обязательные переменные
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error(ENV_VALIDATION_MESSAGES.MISSING_REQUIRED_VARS);
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error(ENV_VALIDATION_MESSAGES.CREATE_ENV_FILE);
    process.exit(1);
  }

  console.log(ENV_VALIDATION_MESSAGES.VALIDATION_SUCCESS);
}

// Экспортируем объект с переменными окружения
export const env = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  AUTHORIZED_USER_ID: process.env.AUTHORIZED_USER_ID,
  USER_ID: process.env.USER_ID,
  USER_NAME: process.env.USER_NAME,
  STORAGE_PATH: process.env.STORAGE_PATH,
};

// Функция проверки авторизации пользователя
export function isAuthorized(userId) {
  return userId.toString() === env.AUTHORIZED_USER_ID;
}
