// Функция для красивого форматирования времени работы
export function formatUptime(seconds) {
  const years = Math.floor(seconds / (365.25 * 24 * 3600));
  const months = Math.floor((seconds % (365.25 * 24 * 3600)) / (30.44 * 24 * 3600));
  const days = Math.floor((seconds % (30.44 * 24 * 3600)) / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let result = '';
  if (years > 0) result += `${years}г `;
  if (months > 0) result += `${months}мес `;
  if (days > 0) result += `${days}д `;
  if (hours > 0) result += `${hours}ч `;
  if (minutes > 0) result += `${minutes}м`;

  return result.trim() || '0м';
}

// Функция для получения размера файла в человекочитаемом формате
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Функция для форматирования даты в нужный формат
export function formatDate(date) {
  const pad = (num) => String(num).padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = pad(date.getFullYear().toString().slice(-2));
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}.${month}.${year}-${hours}.${minutes}.${seconds}`;
}

// Функция для создания безопасного имени файла
export function createSafeFileName(originalName = '', defaultExt = '') {
  const timestamp = formatDate(new Date());

  // Очищаем оригинальное имя от спецсимволов
  let cleanName = originalName.replace(/[^\w\s.-]/g, '').trim();
  if (!cleanName) {
    cleanName = 'file';
  }

  // Добавляем расширение, если его нет
  if (!cleanName.includes('.') && defaultExt) {
    cleanName += defaultExt;
  }

  return `${timestamp}-${cleanName}`;
}

// Функция для экранирования специальных символов Markdown
export function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
}

// Функция для генерации случайного 4-значного кода
export function generateSuspendCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Функция для проверки актуальности сообщения (игнорируем старше 60 секунд)
export function isMessageTooOld(msg, maxAgeSeconds = 60) {
  const now = Math.floor(Date.now() / 1000);
  return now - msg.date > maxAgeSeconds;
}

// Функция для сравнения клавиатур
export function areKeyboardsEqual(keyboard1, keyboard2) {
  if (!keyboard1 || !keyboard2) return false;
  if (!keyboard1.keyboard || !keyboard2.keyboard) return false;

  const keys1 = keyboard1.keyboard.flat();
  const keys2 = keyboard2.keyboard.flat();

  return JSON.stringify(keys1) === JSON.stringify(keys2);
}

// Функция для форматирования скорости сети
export function formatNetworkSpeed(bytesPerSec) {
  const kbps = bytesPerSec / 1024;
  const mbps = kbps / 1024;

  if (mbps >= 1) {
    return `${mbps.toFixed(1)} МБ/с`;
  } else if (kbps >= 1) {
    return `${kbps.toFixed(1)} КБ/с`;
  } else {
    return `${bytesPerSec.toFixed(0)} Б/с`;
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
