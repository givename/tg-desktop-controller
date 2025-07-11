import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import os from 'os';

import { env } from './env.config.mjs';
import { formatNetworkSpeed, formatUptime, sleep } from './utils.mjs';
import {
  ERRORS,
  STATUS,
  CONSOLE_MESSAGES,
  ERROR_TEMPLATES,
  NETWORK_SPEED_TEMPLATE,
  SYSTEM_INFO_TEMPLATE,
  AUDIO_INFO_TEMPLATE,
  SCREENSHOT_CAPTION_TEMPLATE,
  COMMAND_DESCRIPTIONS,
  SYSTEM_COMMANDS,
} from './text.provider.mjs';

const execAsync = promisify(exec);

// Функция для выполнения системных команд
export async function executeCommand(command, description) {
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log(CONSOLE_MESSAGES.COMMAND_SUCCESS(description, command));
    if (stderr) console.warn(CONSOLE_MESSAGES.COMMAND_WARNING(stderr));
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    console.error(CONSOLE_MESSAGES.COMMAND_FAILED(description, error.message));
    return { success: false, error: error.message };
  }
}

// Функция для выполнения аудио команд с правильными переменными окружения
export async function executeAudioCommand(command, description) {
  try {
    // Проверяем наличие переменных окружения
    if (!env.LINUX_USER_ID || !env.LINUX_USER_NAME) {
      throw new Error(ERRORS.MISSING_USER_ENV);
    }

    const userId = env.LINUX_USER_ID;
    const username = env.LINUX_USER_NAME;
    const audioEnv = `PULSE_SERVER=unix:/run/user/${userId}/pulse/native XDG_RUNTIME_DIR=/run/user/${userId}`;

    const fullCommand = `sudo -u ${username} ${audioEnv} ${command}`;
    const { stdout, stderr } = await execAsync(fullCommand);

    console.log(CONSOLE_MESSAGES.COMMAND_SUCCESS(description, fullCommand));
    if (stderr) console.warn(CONSOLE_MESSAGES.COMMAND_WARNING(stderr));
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    console.error(CONSOLE_MESSAGES.COMMAND_FAILED(description, error.message));
    return { success: false, error: error.message };
  }
}

// Функция для получения текущей громкости
export async function getCurrentVolume() {
  try {
    const result = await executeAudioCommand(
      'pactl get-sink-volume @DEFAULT_SINK@',
      COMMAND_DESCRIPTIONS.GET_VOLUME
    );
    if (result.success) {
      const volumeMatch = result.output.match(/(\d+)%/);
      return volumeMatch ? volumeMatch[1] + '%' : STATUS.UNKNOWN;
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    return STATUS.UNKNOWN;
  }
}

// Функция для получения статуса mute
export async function getMuteStatus() {
  try {
    const result = await executeAudioCommand(
      'pactl get-sink-mute @DEFAULT_SINK@',
      COMMAND_DESCRIPTIONS.GET_MUTE_STATUS
    );
    if (result.success) {
      return result.output.includes('yes') ? STATUS.DISABLED : STATUS.ENABLED;
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    return STATUS.UNKNOWN;
  }
}

// Функция для получения информации о текущем треке
export async function getCurrentTrack() {
  try {
    const result = await executeAudioCommand(
      SYSTEM_COMMANDS.GET_TRACK_METADATA,
      COMMAND_DESCRIPTIONS.GET_TRACK_INFO
    );
    if (result.success) {
      return result.output.trim() || STATUS.NOTHING_PLAYING;
    }
    return STATUS.NOTHING_PLAYING;
  } catch (error) {
    return STATUS.NOTHING_PLAYING;
  }
}

// Функция для получения статуса воспроизведения
export async function getPlaybackStatus() {
  try {
    const result = await executeAudioCommand(
      SYSTEM_COMMANDS.GET_PLAYBACK_STATUS,
      COMMAND_DESCRIPTIONS.GET_PLAYBACK_STATUS
    );
    if (result.success) {
      const status = result.output.trim().toLowerCase();
      switch (status) {
        case 'playing':
          return STATUS.PLAYING;
        case 'paused':
          return STATUS.PAUSED;
        default:
          return STATUS.STOPPED;
      }
    }
    return STATUS.STOPPED;
  } catch (error) {
    return STATUS.STOPPED;
  }
}

// Функция для получения статуса микрофона
export async function getMicrophoneStatus() {
  try {
    const result = await executeAudioCommand(
      'pactl get-source-mute @DEFAULT_SOURCE@',
      COMMAND_DESCRIPTIONS.GET_MICROPHONE_STATUS
    );
    if (result.success) {
      return result.output.includes('yes') ? STATUS.DISABLED : STATUS.ENABLED;
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    return STATUS.UNKNOWN;
  }
}

// Функция для получения полной аудио информации
export async function getAudioInfo() {
  const [volume, muteStatus, track, playStatus, micStatus] = await Promise.all([
    getCurrentVolume(),
    getMuteStatus(),
    getCurrentTrack(),
    getPlaybackStatus(),
    getMicrophoneStatus(),
  ]);

  return AUDIO_INFO_TEMPLATE({
    soundStatus: muteStatus,
    volume,
    microphoneStatus: micStatus,
    playbackStatus: playStatus,
    currentTrack: track,
  });
}

// Функция для получения использования сети за последние 5 секунд
export async function getNetworkSpeed() {
  try {
    // Получаем список сетевых интерфейсов
    const networkInterfaces = await si.networkInterfaces();
    const activeInterface = networkInterfaces.find(
      (iface) =>
        iface.default ||
        (iface.type === 'wireless' && iface.operstate === 'up') ||
        (iface.type === 'wired' && iface.operstate === 'up')
    );

    if (!activeInterface) {
      return `📡 ${ERRORS.ACTIVE_INTERFACE_NOT_FOUND}`;
    }

    // Получаем текущую статистику
    const stats1 = await si.networkStats(activeInterface.iface);

    // Ждем 5 секунд для замера скорости использования
    await sleep(5000);

    // Получаем статистику через 5 секунд
    const stats2 = await si.networkStats(activeInterface.iface);

    if (stats1.length > 0 && stats2.length > 0) {
      const timeDiff = 5; // 5 секунд
      const rxSpeed = (stats2[0].rx_bytes - stats1[0].rx_bytes) / timeDiff; // байт/сек использования
      const txSpeed = (stats2[0].tx_bytes - stats1[0].tx_bytes) / timeDiff; // байт/сек использования

      return NETWORK_SPEED_TEMPLATE(formatNetworkSpeed(txSpeed), formatNetworkSpeed(rxSpeed));
    }

    return `📡 ${ERRORS.NETWORK_SPEED_MEASUREMENT_FAILED}`;
  } catch (error) {
    console.error(CONSOLE_MESSAGES.NETWORK_SPEED_ERROR_LOG(error));
    return `📡 ${ERRORS.NETWORK_SPEED_ERROR}`;
  }
}

// Функция для создания скриншотов всех мониторов
export async function takeScreenshots() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Проверяем наличие scrot
    const checkScrot = await execAsync('which scrot');
    if (!checkScrot.stdout) {
      return {
        success: false,
        error: ERRORS.SCROT_NOT_INSTALLED,
      };
    }

    // Получаем информацию о мониторах через xrandr
    const { stdout: xrandrOutput } = await execAsync('xrandr | grep " connected"');
    const displays = xrandrOutput
      .split('\n')
      .filter((line) => line.includes(' connected'))
      .map((line) => {
        const match = line.match(/^([^ ]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (displays.length === 0) {
      return {
        success: false,
        error: ERRORS.MONITORS_NOT_DETECTED,
      };
    }

    // Создаем скриншоты для каждого монитора
    const screenshots = [];
    for (let i = 0; i < displays.length; i++) {
      const display = displays[i];
      const filename = `screenshot-${timestamp}-${display}.png`;
      const filepath = `/tmp/${filename}`;

      // Получаем геометрию монитора
      const { stdout: geometry } = await execAsync(
        `xrandr | grep "${display} connected" | grep -o '[0-9]\\+x[0-9]\\++[0-9]\\++[0-9]\\+'`
      );
      if (!geometry.trim()) {
        continue; // Пропускаем монитор, если не удалось получить его геометрию
      }

      // Парсим геометрию из формата WIDTHxHEIGHT+X+Y в X,Y,WIDTH,HEIGHT
      const match = geometry.trim().match(/(\d+)x(\d+)\+(\d+)\+(\d+)/);
      if (!match) {
        continue; // Пропускаем монитор, если не удалось распарсить геометрию
      }

      const [_, width, height, x, y] = match;
      // Делаем скриншот конкретного монитора используя его геометрию
      await execAsync(`DISPLAY=:0 scrot '${filepath}' -a ${x},${y},${width},${height}`);

      screenshots.push({
        filepath,
        caption: SCREENSHOT_CAPTION_TEMPLATE(display, i + 1, displays.length),
      });
    }

    if (screenshots.length === 0) {
      return {
        success: false,
        error: ERRORS.NO_SCREENSHOTS_CREATED,
      };
    }

    return {
      success: true,
      screenshots,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Высокоуровневые операции для аудио
export async function soundOn() {
  return await executeAudioCommand(
    'pactl set-sink-mute @DEFAULT_SINK@ false',
    COMMAND_DESCRIPTIONS.ENABLE_SOUND
  );
}

export async function soundOff() {
  return await executeAudioCommand(
    'pactl set-sink-mute @DEFAULT_SINK@ true',
    COMMAND_DESCRIPTIONS.DISABLE_SOUND
  );
}

export async function playAudio() {
  return await executeAudioCommand('playerctl play', COMMAND_DESCRIPTIONS.START_PLAYBACK);
}

export async function pauseAudio() {
  return await executeAudioCommand('playerctl pause', COMMAND_DESCRIPTIONS.PAUSE_PLAYBACK);
}

export async function nextTrack() {
  return await executeAudioCommand('playerctl next', COMMAND_DESCRIPTIONS.NEXT_TRACK);
}

export async function previousTrack() {
  return await executeAudioCommand('playerctl previous', COMMAND_DESCRIPTIONS.PREVIOUS_TRACK);
}

export async function volumeUp() {
  return await executeAudioCommand(
    'pactl set-sink-volume @DEFAULT_SINK@ +5%',
    COMMAND_DESCRIPTIONS.INCREASE_VOLUME
  );
}

export async function volumeDown() {
  return await executeAudioCommand(
    'pactl set-sink-volume @DEFAULT_SINK@ -5%',
    COMMAND_DESCRIPTIONS.DECREASE_VOLUME
  );
}

export async function microphoneOn() {
  const result = await executeAudioCommand(
    'pactl set-source-mute @DEFAULT_SOURCE@ false',
    COMMAND_DESCRIPTIONS.ENABLE_MICROPHONE
  );
  if (result.success) {
    const micStatus = await getMicrophoneStatus();
    return { success: true, message: `🎤 Микрофон включен (${micStatus})` };
  } else {
    return { success: false, message: `❌ Ошибка включения микрофона: ${result.error}` };
  }
}

export async function microphoneOff() {
  const result = await executeAudioCommand(
    'pactl set-source-mute @DEFAULT_SOURCE@ true',
    COMMAND_DESCRIPTIONS.DISABLE_MICROPHONE
  );
  if (result.success) {
    const micStatus = await getMicrophoneStatus();
    return { success: true, message: `🎤 Микрофон выключен (${micStatus})` };
  } else {
    return { success: false, message: `❌ Ошибка выключения микрофона: ${result.error}` };
  }
}

// Системные операции
export async function displayOff() {
  return await executeCommand('xset dpms force off', COMMAND_DESCRIPTIONS.TURN_OFF_DISPLAY);
}

export async function suspendSystem() {
  return await executeCommand('systemctl suspend', COMMAND_DESCRIPTIONS.SUSPEND_SYSTEM);
}

export async function rebootSystem() {
  return await executeCommand('systemctl reboot', COMMAND_DESCRIPTIONS.REBOOT_SYSTEM);
}

// Очистка временных файлов
export async function cleanupTempFiles(filepaths) {
  try {
    for (const filepath of filepaths) {
      await executeCommand(`rm '${filepath}'`, COMMAND_DESCRIPTIONS.DELETE_FILE(filepath));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Функция для получения информации о системе
export async function getSystemInfo() {
  try {
    const [cpu, mem, osInfo, system, graphics] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.system(),
      si.graphics(),
    ]);

    // Получаем загрузку CPU и время работы
    const cpuLoad = await si.currentLoad();
    const uptimeSeconds = os.uptime();
    const formattedUptime = formatUptime(uptimeSeconds);

    // Исправляем расчет памяти с учетом кеша
    const totalMemGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
    const availableMemGB = (mem.available / 1024 / 1024 / 1024).toFixed(1);
    const realUsedMemGB = ((mem.total - mem.available) / 1024 / 1024 / 1024).toFixed(1);
    const memUsagePercent = (((mem.total - mem.available) / mem.total) * 100).toFixed(1);

    // Получаем сетевую скорость (может занять несколько секунд)
    const networkSpeed = await getNetworkSpeed();

    return SYSTEM_INFO_TEMPLATE({
      motherboard: `${system.manufacturer} ${system.model}`,
      cpu: `${cpu.manufacturer} ${cpu.brand}`,
      cores: `${cpu.cores} (${cpu.physicalCores} физических)`,
      graphics: graphics.controllers.map((gpu) => `${gpu.vendor} ${gpu.model}`).join(', '),
      os: `${osInfo.distro} ${osInfo.release}`,
      arch: osInfo.arch,
      kernel: osInfo.kernel,
      cpuLoad: `${cpuLoad.currentLoad.toFixed(1)}%`,
      memory: `${realUsedMemGB} GB / ${totalMemGB} GB (${memUsagePercent}%)`,
      availableMemory: `${availableMemGB} GB`,
      uptime: formattedUptime,
      networkSpeed: networkSpeed,
    });
  } catch (error) {
    console.error(CONSOLE_MESSAGES.SYSTEM_INFO_ERROR_LOG(error));
    throw new Error(ERRORS.SYSTEM_INFO_ERROR);
  }
}

// Функция для получения uptime бота и системы
export async function getUptime(botStartTime) {
  try {
    // Время работы системы
    const systemUptimeSeconds = os.uptime();
    const systemUptime = formatUptime(systemUptimeSeconds);

    // Время работы бота
    const botUptimeMs = Date.now() - botStartTime;
    const botUptimeSeconds = Math.floor(botUptimeMs / 1000);
    const botUptime = formatUptime(botUptimeSeconds);

    return `🤖 **Время работы бота:** ${botUptime}\n💻 **Время работы системы:** ${systemUptime}`;
  } catch (error) {
    console.error(`Ошибка получения uptime: ${error.message}`);
    return '❌ Ошибка получения информации о времени работы';
  }
}

// Функция для проверки и создания директории хранения
export async function ensureStorageDirectory() {
  if (!env.STORAGE_PATH) {
    return {
      success: false,
      error: ERRORS.STORAGE_PATH_NOT_SET,
    };
  }

  try {
    // Создаем директорию, если она не существует
    await execAsync(`mkdir -p "${env.STORAGE_PATH}"`);
    return {
      success: true,
      path: env.STORAGE_PATH.replace(/\/+$/, ''), // Убираем trailing слеши
    };
  } catch (error) {
    return {
      success: false,
      error: ERROR_TEMPLATES.STORAGE_DIRECTORY_CREATE_ERROR(error.message),
    };
  }
}

// Функция для установки правильного владельца файла
export async function setFileOwnership(filePath) {
  if (env.LINUX_USER_NAME && env.LINUX_USER_ID) {
    try {
      await execAsync(`chown ${env.LINUX_USER_NAME}:${env.LINUX_USER_NAME} "${filePath}"`);
      await execAsync(`chmod 644 "${filePath}"`);
    } catch (chownError) {
      console.warn(CONSOLE_MESSAGES.CHOWN_WARNING(chownError.message));
    }
  }
}
