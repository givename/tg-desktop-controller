import { areKeyboardsEqual } from './utils.mjs';
import { DEFAULT_KEYBOARD } from './text.provider.mjs';

// Хранилище текущих клавиатур для каждого чата
const currentKeyboards = new Map();
// Флаг для принудительной отправки клавиатуры
const forceKeyboardSend = new Map();

// Функция для получения клавиатуры с проверкой необходимости обновления
export function getKeyboard(chatId, force = false) {
  const currentKeyboard = currentKeyboards.get(chatId);
  const shouldForce = forceKeyboardSend.get(chatId) || force;

  // Если принудительная отправка или клавиатура не установлена/отличается
  if (shouldForce || !areKeyboardsEqual(currentKeyboard, DEFAULT_KEYBOARD)) {
    currentKeyboards.set(chatId, DEFAULT_KEYBOARD);
    // Сбрасываем флаг принудительной отправки после использования
    if (shouldForce) {
      forceKeyboardSend.delete(chatId);
    }
    return DEFAULT_KEYBOARD;
  }

  return undefined;
}

// Функция для принудительной установки клавиатуры
export function setKeyboard(chatId, force = false) {
  currentKeyboards.set(chatId, DEFAULT_KEYBOARD);
  if (force) {
    forceKeyboardSend.set(chatId, true);
  }
}

// Функция для сброса клавиатуры чата (если понадобится)
export function resetKeyboard(chatId) {
  currentKeyboards.delete(chatId);
  forceKeyboardSend.delete(chatId);
}
