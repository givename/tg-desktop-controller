import { generateSuspendCode } from './utils.mjs';

// Храним коды подтверждения для режима сна и перезагрузки
const confirmationCodes = new Map();

// Создать код подтверждения
export function createConfirmationCode(userId, chatId, action) {
  const code = generateSuspendCode();
  confirmationCodes.set(userId, {
    code: code,
    chatId: chatId,
    timestamp: Date.now(),
    action: action,
  });

  // Удаляем код через 5 минут
  setTimeout(
    () => {
      confirmationCodes.delete(userId);
    },
    5 * 60 * 1000
  );

  return code;
}

// Проверить код подтверждения
export function validateConfirmationCode(userId, inputCode) {
  if (!confirmationCodes.has(userId)) {
    return { valid: false, data: null };
  }

  const savedData = confirmationCodes.get(userId);

  if (inputCode === savedData.code) {
    confirmationCodes.delete(userId);
    return { valid: true, data: savedData };
  } else {
    return { valid: false, data: null };
  }
}

// Проверить, есть ли активный код для пользователя
export function hasActiveCode(userId) {
  return confirmationCodes.has(userId);
}
