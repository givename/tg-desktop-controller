import { promises as fs } from 'fs';

import * as linuxController from './os.linux.controller.mjs';
import * as windowsController from './os.windows.controller.mjs';
import { createSafeFileName, escapeMarkdown, formatFileSize, sleep } from './utils.mjs';
import {
  SUCCESS_MESSAGES,
  ERROR_TEMPLATES,
  CONSOLE_MESSAGES,
  FILE_SAVE_TEMPLATE,
  SYSTEM_ERROR_MESSAGES,
} from './text.provider.mjs';

// Определяем платформу и выбираем соответствующий контроллер
const platformController = (() => {
  const platform = process.platform;

  switch (platform) {
    case 'linux':
      return linuxController;
    case 'win32':
      return windowsController;
    default:
      throw new Error(SYSTEM_ERROR_MESSAGES.UNSUPPORTED_PLATFORM(platform));
  }
})();

// Время запуска бота
const botStartTime = Date.now();

// Функции системной информации - прямые вызовы без декомпозиции
export async function getAudioInfo() {
  return await platformController.getAudioInfo();
}

export async function getNetworkSpeed() {
  return await platformController.getNetworkSpeed();
}

export async function getSystemInfo() {
  return await platformController.getSystemInfo();
}

export async function ensureStorageDirectory() {
  return await platformController.ensureStorageDirectory();
}

export async function setFileOwnership(filePath) {
  return await platformController.setFileOwnership(filePath);
}

export async function cleanupTempFiles(filepaths) {
  return await platformController.cleanupTempFiles(filepaths);
}

// Новая функция uptime
export async function getUptime() {
  return await platformController.getUptime(botStartTime);
}

// Высокоуровневые функции управления системой

// Аудио команды
export async function soundOn() {
  const result = await platformController.soundOn();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.SOUND_ON}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.SOUND_ON_ERROR(result.error) };
  }
}

export async function soundOff() {
  const result = await platformController.soundOff();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.SOUND_OFF}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.SOUND_OFF_ERROR(result.error) };
  }
}

export async function playAudio() {
  const result = await platformController.playAudio();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.PLAY_STARTED}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.PLAY_ERROR(result.error) };
  }
}

export async function pauseAudio() {
  const result = await platformController.pauseAudio();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.PLAY_PAUSED}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.PAUSE_ERROR(result.error) };
  }
}

export async function nextTrack() {
  const result = await platformController.nextTrack();
  if (result.success) {
    // Ждем 2 секунды, чтобы система успела обновить информацию о новом треке
    await sleep(2000);
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.NEXT_TRACK}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.NEXT_TRACK_ERROR(result.error) };
  }
}

export async function previousTrack() {
  const result = await platformController.previousTrack();
  if (result.success) {
    // Ждем 1 секунду, чтобы система успела обновить информацию о новом треке
    await sleep(1000);
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.PREV_TRACK}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.PREV_TRACK_ERROR(result.error) };
  }
}

export async function volumeUp() {
  const result = await platformController.volumeUp();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.VOLUME_UP}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.VOLUME_ERROR(result.error) };
  }
}

export async function volumeDown() {
  const result = await platformController.volumeDown();
  if (result.success) {
    const audioInfo = await getAudioInfo();
    return { success: true, message: `${SUCCESS_MESSAGES.VOLUME_DOWN}\n\n${audioInfo}` };
  } else {
    return { success: false, message: ERROR_TEMPLATES.VOLUME_ERROR(result.error) };
  }
}

// Микрофон
export async function microphoneOn() {
  const result = await platformController.microphoneOn();
  return result;
}

export async function microphoneOff() {
  const result = await platformController.microphoneOff();
  return result;
}

// Система
export async function displayOff() {
  const result = await platformController.displayOff();
  if (result.success) {
    return { success: true, message: SUCCESS_MESSAGES.DISPLAY_OFF };
  } else {
    return { success: false, message: ERROR_TEMPLATES.DISPLAY_OFF_ERROR(result.error) };
  }
}

export async function suspendSystem() {
  const result = await platformController.suspendSystem();
  if (!result.success) {
    return { success: false, message: ERROR_TEMPLATES.SUSPEND_ERROR(result.error) };
  }
  // Если команда успешна, компьютер уйдет в сон и сообщение может не отправиться
  return { success: true, message: '' };
}

export async function rebootSystem() {
  const result = await platformController.rebootSystem();
  if (!result.success) {
    return { success: false, message: ERROR_TEMPLATES.REBOOT_ERROR(result.error) };
  }
  // Если команда успешна, компьютер перезагрузится и сообщение может не отправиться
  return { success: true, message: '' };
}

// Скриншоты
export async function takeScreenshots() {
  return await platformController.takeScreenshots();
}

// Файловые операции
export async function saveFile(bot, fileId, fileName) {
  try {
    const dirCheck = await ensureStorageDirectory();
    if (!dirCheck.success) {
      return { success: false, message: dirCheck.error };
    }

    // Скачиваем файл в директорию и получаем фактический путь
    const downloadedPath = await bot.downloadFile(fileId, dirCheck.path);

    // Определяем целевой путь с желаемым именем
    const targetPath = `${dirCheck.path}/${fileName}`;

    // Переименовываем файл
    await fs.rename(downloadedPath, targetPath);

    // Устанавливаем правильного владельца файла
    await setFileOwnership(targetPath);

    return {
      success: true,
      path: targetPath,
    };
  } catch (error) {
    console.error(CONSOLE_MESSAGES.FILE_SAVE_ERROR_LOG(error));
    return {
      success: false,
      message: ERROR_TEMPLATES.FILE_SAVE_ERROR(error.message),
    };
  }
}

export async function savePhoto(bot, photo) {
  const fileId = photo.file_id;
  const fileName = createSafeFileName('photo', '.jpg');

  const result = await saveFile(bot, fileId, fileName);
  if (result.success) {
    const escapedPath = escapeMarkdown(result.path);
    return {
      success: true,
      message: `${SUCCESS_MESSAGES.PHOTO_SAVED}\n${FILE_SAVE_TEMPLATE(escapedPath, formatFileSize(photo.file_size))}`,
    };
  } else {
    return result;
  }
}

export async function saveDocument(bot, document) {
  const fileId = document.file_id;
  const fileName = createSafeFileName(document.file_name);

  const result = await saveFile(bot, fileId, fileName);
  if (result.success) {
    const escapedPath = escapeMarkdown(result.path);
    return {
      success: true,
      message: `${SUCCESS_MESSAGES.FILE_SAVED}\n${FILE_SAVE_TEMPLATE(escapedPath, formatFileSize(document.file_size))}`,
    };
  } else {
    return result;
  }
}
