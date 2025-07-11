import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import os from 'os';
import fs from 'fs';

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

// Функция для скрытого выполнения nircmd команд
async function execNircmdHidden(command) {
  // Используем несколько подходов для скрытия окна nircmd
  try {
    // Подход 1: Используем CreateNoWindow flag через spawn
    const { spawn } = await import('child_process');
    const args = command.split(' ').slice(1); // Убираем 'nircmd'

    return new Promise((resolve, reject) => {
      const child = spawn('nircmd', args, {
        windowsHide: true,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`nircmd exited with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    // Fallback к execAsync с дополнительными флагами
    console.warn('⚠️ Fallback к execAsync для nircmd');
    return execAsync(command, {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
}

// Общие вспомогательные функции через NirCmd
export async function executeCommand(command, description) {
  try {
    console.log(`✅ ${description}: ${command}`);
    const { stdout, stderr } = await execAsync(command);

    if (stderr && stderr.trim()) {
      console.warn(`⚠️ Предупреждение для ${description}: ${stderr}`);
    }

    return {
      success: true,
      output: stdout.trim(),
      error: null,
    };
  } catch (error) {
    console.error(`❌ Ошибка ${description}: ${error.message}`);
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

// Функции управления звуком через nircmd - УЛУЧШЕННЫЕ БЕЗ POWERSHELL
export async function getCurrentVolume() {
  try {
    // Используем SoundVolumeCommandLine (svcl.exe) от NirSoft
    const { stdout } = await execAsync('svcl.exe /Stdout /GetPercent "DefaultRenderDevice"');
    const volumePercent = parseInt(stdout.trim());
    if (!isNaN(volumePercent)) {
      return `${volumePercent}%`;
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    console.error('Ошибка получения громкости:', error);
    return STATUS.UNKNOWN;
  }
}

export async function getMuteStatus() {
  try {
    // Используем SoundVolumeCommandLine для проверки mute
    const { stdout } = await execAsync('svcl.exe /Stdout /GetMute "DefaultRenderDevice"');
    const muteStatus = stdout.trim().toLowerCase();
    if (muteStatus === '1') return STATUS.DISABLED;
    if (muteStatus === '0') return STATUS.ENABLED;
    return STATUS.UNKNOWN;
  } catch (error) {
    console.error('Ошибка получения статуса mute:', error);
    return STATUS.UNKNOWN;
  }
}

export async function soundOn() {
  try {
    await execNircmdHidden('nircmd mutesysvolume 0');
    console.log('✅ Звук включен через nircmd');
    return { success: true, message: '🔊 Звук включен' };
  } catch (error) {
    console.error('❌ Ошибка включения звука:', error);
    return { success: false, message: '❌ Ошибка включения звука', error: error.message };
  }
}

export async function soundOff() {
  try {
    await execNircmdHidden('nircmd mutesysvolume 1');
    console.log('✅ Звук выключен через nircmd');
    return { success: true, message: '🔇 Звук выключен' };
  } catch (error) {
    console.error('❌ Ошибка выключения звука:', error);
    return { success: false, message: '❌ Ошибка выключения звука', error: error.message };
  }
}

export async function setVolume(volume) {
  try {
    const vol = Math.max(0, Math.min(100, volume));
    const nircmdVolume = Math.round((vol / 100) * 65535);
    await execNircmdHidden(`nircmd setsysvolume ${nircmdVolume}`);
    console.log(`✅ Громкость установлена: ${vol}% через nircmd`);
    return { success: true, volume: vol };
  } catch (error) {
    console.error('❌ Ошибка установки громкости:', error);
    return { success: false, error: error.message };
  }
}

export async function volumeUp() {
  try {
    const changeAmount = Math.round(65535 * 0.05);
    await execNircmdHidden(`nircmd changesysvolume ${changeAmount}`);
    console.log('✅ Громкость увеличена через nircmd');
    return { success: true, message: '🔊 Громкость увеличена' };
  } catch (error) {
    console.error('❌ Ошибка увеличения громкости:', error);
    return { success: false, message: '❌ Ошибка увеличения громкости', error: error.message };
  }
}

export async function volumeDown() {
  try {
    const changeAmount = Math.round(65535 * 0.05);
    await execNircmdHidden(`nircmd changesysvolume -${changeAmount}`);
    console.log('✅ Громкость уменьшена через nircmd');
    return { success: true, message: '🔉 Громкость уменьшена' };
  } catch (error) {
    console.error('❌ Ошибка уменьшения громкости:', error);
    return { success: false, message: '❌ Ошибка уменьшения громкости', error: error.message };
  }
}

export async function getCurrentTrack() {
  // Анализ треков отключен - всегда возвращаем "Ничего не воспроизводится"
  return STATUS.TRACK_UNDETERMINED;
}

export async function getPlaybackStatus() {
  try {
    const psCommand = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
      $sessionManager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
      $sessionManager.AsTask().Wait(-1) | Out-Null
      $currentSession = $sessionManager.Result.GetCurrentSession()
      if ($currentSession) {
        $playbackInfo = $currentSession.GetPlaybackInfo()
        $status = $playbackInfo.PlaybackStatus
        Write-Output "STATUS:$status"
        if ($status -eq 'Playing') {
          Write-Output 'Playing'
        } elseif ($status -eq 'Paused') {
          Write-Output 'Paused'  
        } else {
          Write-Output 'Stopped'
        }
      } else {
        Write-Output 'NO_SESSION'
        Write-Output 'Undetermined'
      }
    `
      .replace(/\s+/g, ' ')
      .trim();

    const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
    console.log('🎵 Вывод PowerShell для статуса воспроизведения:');
    console.log(stdout);

    const lines = stdout.split('\n');
    const status = lines[lines.length - 1].trim().toLowerCase();

    console.log(`🎵 Финальный статус: "${status}"`);

    if (status === 'playing') return STATUS.PLAYING;
    if (status === 'paused') return STATUS.PAUSED;
    if (status === 'undetermined') return STATUS.TRACK_UNDETERMINED;

    return STATUS.STOPPED;
  } catch (error) {
    console.error('Ошибка статуса воспроизведения:', error);
    return STATUS.TRACK_UNDETERMINED;
  }
}

export async function getMicrophoneStatus() {
  // Заглушка - всегда возвращаем "Неопределяемый"
  return STATUS.TRACK_UNDETERMINED;
}

// Функция для получения полной аудио информации с детальным логированием
export async function getAudioInfo() {
  console.log('🔍 Начинаю сбор аудио информации...');
  const startTime = performance.now();

  try {
    // Создаем функции с измерением времени выполнения
    const functionTimings = {};

    const createTimedFunction = (func, name) => {
      return async () => {
        const funcStart = performance.now();
        try {
          const result = await func();
          const funcEnd = performance.now();
          functionTimings[name] = (funcEnd - funcStart).toFixed(2);
          console.log(`⏱️ ${name}: ${functionTimings[name]}ms`);
          return result;
        } catch (error) {
          const funcEnd = performance.now();
          functionTimings[name] = (funcEnd - funcStart).toFixed(2);
          console.log(`⏱️ ${name}: ${functionTimings[name]}ms (ОШИБКА)`);
          throw error;
        }
      };
    };

    const results = await Promise.allSettled([
      createTimedFunction(getCurrentVolume, 'getCurrentVolume')(),
      createTimedFunction(getMuteStatus, 'getMuteStatus')(),
      createTimedFunction(getCurrentTrack, 'getCurrentTrack')(),
      createTimedFunction(getPlaybackStatus, 'getPlaybackStatus')(),
      createTimedFunction(getMicrophoneStatus, 'getMicrophoneStatus')(),
    ]);

    const [volumeResult, muteResult, trackResult, playResult, micResult] = results;

    // Логируем результаты для диагностики
    console.log('📊 Результаты сбора информации:');
    console.log(
      `   Громкость: ${volumeResult.status === 'fulfilled' ? volumeResult.value : 'ОШИБКА - ' + volumeResult.reason}`
    );
    console.log(
      `   Mute статус: ${muteResult.status === 'fulfilled' ? muteResult.value : 'ОШИБКА - ' + muteResult.reason}`
    );
    console.log(
      `   Трек: ${trackResult.status === 'fulfilled' ? trackResult.value : 'ОШИБКА - ' + trackResult.reason}`
    );
    console.log(
      `   Статус воспроизведения: ${playResult.status === 'fulfilled' ? playResult.value : 'ОШИБКА - ' + playResult.reason}`
    );
    console.log(
      `   Микрофон: ${micResult.status === 'fulfilled' ? micResult.value : 'ОШИБКА - ' + micResult.reason}`
    );

    // Показываем общую статистику производительности
    const totalTime = (performance.now() - startTime).toFixed(2);
    console.log('📈 Статистика производительности:');
    console.log(`   Общее время: ${totalTime}ms`);
    Object.entries(functionTimings).forEach(([name, time]) => {
      const percentage = ((parseFloat(time) / parseFloat(totalTime)) * 100).toFixed(1);
      console.log(`   ${name}: ${time}ms (${percentage}%)`);
    });

    // Определяем самую медленную функцию
    if (Object.keys(functionTimings).length > 0) {
      const slowestFunc = Object.entries(functionTimings).reduce((a, b) =>
        parseFloat(a[1]) > parseFloat(b[1]) ? a : b
      );
      console.log(`🐌 Самая медленная функция: ${slowestFunc[0]} (${slowestFunc[1]}ms)`);
    }

    const volume = volumeResult.status === 'fulfilled' ? volumeResult.value : STATUS.UNKNOWN;
    const muteStatus = muteResult.status === 'fulfilled' ? muteResult.value : STATUS.UNKNOWN;
    const track = trackResult.status === 'fulfilled' ? trackResult.value : STATUS.NOTHING_PLAYING;
    const playStatus = playResult.status === 'fulfilled' ? playResult.value : STATUS.STOPPED;
    const micStatus =
      micResult.status === 'fulfilled' ? micResult.value : STATUS.TRACK_UNDETERMINED;

    return AUDIO_INFO_TEMPLATE({
      soundStatus: muteStatus,
      volume,
      microphoneStatus: micStatus,
      playbackStatus: playStatus,
      currentTrack: track,
    });
  } catch (error) {
    const totalTime = (performance.now() - startTime).toFixed(2);
    console.error(`❌ Ошибка в getAudioInfo (${totalTime}ms):`, error);
    return AUDIO_INFO_TEMPLATE({
      soundStatus: STATUS.UNKNOWN,
      volume: STATUS.UNKNOWN,
      microphoneStatus: STATUS.UNKNOWN,
      playbackStatus: STATUS.UNKNOWN,
      currentTrack: STATUS.NOTHING_PLAYING,
    });
  }
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

// Создание скриншотов через nircmd
export async function takeScreenshots() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Пробуем несколько вариантов папок по приоритету
    const possibleDirs = [
      process.env.TEMP,
      process.env.TMP,
      'C:\\Windows\\Temp',
      'C:\\Temp',
      process.cwd(),
      'C:\\Users\\Public\\Desktop',
    ].filter(Boolean);

    let tempDir = null;
    let dirIndex = 0;

    // Ищем рабочую папку
    for (const dir of possibleDirs) {
      const cleanDir = dir.replace(/[\\\/]+$/, '');
      console.log(`🔍 Проверяю папку ${dirIndex + 1}/${possibleDirs.length}: ${cleanDir}`);

      try {
        // Проверяем существование и права записи
        if (!fs.existsSync(cleanDir)) {
          fs.mkdirSync(cleanDir, { recursive: true });
          console.log(`📁 Создана папка: ${cleanDir}`);
        }

        // Тестируем запись файла
        const testFile = `${cleanDir}\\test_write_${Date.now()}.tmp`;
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);

        tempDir = cleanDir;
        console.log(`✅ Выбрана рабочая папка: ${tempDir}`);
        break;
      } catch (error) {
        console.warn(`⚠️ Папка ${cleanDir} недоступна: ${error.message}`);
      }
      dirIndex++;
    }

    if (!tempDir) {
      throw new Error('Не удалось найти доступную папку для скриншота');
    }

    // Определяем количество мониторов с детальной диагностикой
    let monitorCount = 1;
    try {
      console.log('🔍 Запрашиваю информацию о мониторах через WMIC...');
      const { stdout: monitorInfo } = await execAsync(
        'wmic path Win32_DesktopMonitor get Name /format:csv'
      );

      console.log('📋 Сырой вывод WMIC:');
      console.log('---START---');
      console.log(monitorInfo);
      console.log('---END---');

      const allLines = monitorInfo.split('\n');
      console.log(`📏 Общее количество строк: ${allLines.length}`);

      allLines.forEach((line, index) => {
        console.log(`Строка ${index}: "${line}" (длина: ${line.length})`);
      });

      const monitors = monitorInfo.split('\n').filter((line) => {
        const trimmed = line.trim();
        const hasNode = trimmed.toLowerCase().includes('node');
        const hasName = trimmed.toLowerCase().includes('name');
        const hasComma = trimmed.includes(',');

        // Проверяем на виртуальные/генерические мониторы (текст может быть искажен из-за кодировки)
        const lowerLine = trimmed.toLowerCase();
        const isGenericMonitor =
          lowerLine.includes('универсальный') ||
          lowerLine.includes('universal') ||
          lowerLine.includes('generic') ||
          lowerLine.includes('pnp monitor') ||
          lowerLine.includes('pnp дисплей') ||
          // Проверяем на искаженные символы, которые могут указывать на "универсальный"
          /[\u0430-\u044f\u0410-\u042f]*\s*pnp/i.test(lowerLine) ||
          // Дополнительные паттерны для искаженного текста
          /[а-я]*\s*[а-я]*\s*pnp/i.test(lowerLine);

        console.log(`🔎 Анализ строки: "${trimmed}"`);
        console.log(`   - Не пустая: ${!!trimmed}`);
        console.log(`   - Содержит 'node': ${hasNode}`);
        console.log(`   - Содержит 'name': ${hasName}`);
        console.log(`   - Содержит ',': ${hasComma}`);
        console.log(`   - Генерический монитор: ${isGenericMonitor}`);

        const result = trimmed && !hasNode && !hasName && hasComma && !isGenericMonitor;
        console.log(`   - РЕЗУЛЬТАТ ФИЛЬТРА: ${result}`);

        return result;
      });

      console.log(`🖥️ Отфильтрованные мониторы (${monitors.length}):`);
      monitors.forEach((monitor, index) => {
        console.log(`  ${index + 1}: "${monitor}"`);
      });

      monitorCount = Math.max(1, monitors.length);
      console.log(`🎯 ИТОГО мониторов: ${monitorCount}`);
    } catch (error) {
      console.error('❌ Ошибка получения информации о мониторах:', error);
      console.log('⚠️ Используется fallback: 1 монитор');
      monitorCount = 1;
    }

    const filename = `screenshot_${timestamp}.png`;
    const filepath = `${tempDir}\\${filename}`;

    console.log(`📸 Создаю скриншот: ${filepath}`);

    // Пробуем разные методы создания скриншота
    let screenshotCreated = false;

    // Метод 1: execNircmdHidden
    try {
      await execNircmdHidden(`nircmd savescreenshot "${filepath}"`);
      console.log('🔧 Попытка 1: execNircmdHidden');

      // Ждем немного для завершения записи
      await sleep(500);

      if (fs.existsSync(filepath)) {
        screenshotCreated = true;
        console.log('✅ Скриншот создан через execNircmdHidden');
      }
    } catch (error) {
      console.warn('⚠️ execNircmdHidden не сработал:', error.message);
    }

    // Метод 2: обычный execAsync
    if (!screenshotCreated) {
      try {
        await execAsync(`nircmd savescreenshot "${filepath}"`);
        console.log('🔧 Попытка 2: обычный execAsync');

        await sleep(500);

        if (fs.existsSync(filepath)) {
          screenshotCreated = true;
          console.log('✅ Скриншот создан через execAsync');
        }
      } catch (error) {
        console.warn('⚠️ execAsync также не сработал:', error.message);
      }
    }

    // Метод 3: PowerShell как fallback
    if (!screenshotCreated) {
      try {
        const psCommand = `
          Add-Type -AssemblyName System.Windows.Forms
          Add-Type -AssemblyName System.Drawing
          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
          $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
          $bitmap.Save("${filepath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
          $graphics.Dispose()
          $bitmap.Dispose()
          Write-Host "Screenshot saved"
        `
          .replace(/\s+/g, ' ')
          .trim();

        await execAsync(`powershell -Command "${psCommand}"`);
        console.log('🔧 Попытка 3: PowerShell');

        await sleep(500);

        if (fs.existsSync(filepath)) {
          screenshotCreated = true;
          console.log('✅ Скриншот создан через PowerShell');
        }
      } catch (error) {
        console.warn('⚠️ PowerShell также не сработал:', error.message);
      }
    }

    // Финальная проверка
    if (!screenshotCreated || !fs.existsSync(filepath)) {
      throw new Error(`Файл скриншота не был создан ни одним из методов: ${filepath}`);
    }

    const stats = fs.statSync(filepath);
    console.log(`✅ Скриншот создан: ${filepath} (${Math.round(stats.size / 1024)} КБ)`);

    return {
      success: true,
      screenshots: [
        {
          filepath: filepath,
          caption: SCREENSHOT_CAPTION_TEMPLATE('Primary', 1, monitorCount),
        },
      ],
      message: `✅ Скриншот создан: ${filename}`,
    };
  } catch (error) {
    console.error('❌ Ошибка создания скриншота:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Медиа функции через nircmd
export async function playAudio() {
  try {
    // Проверяем текущий статус
    const currentStatus = await getPlaybackStatus();

    if (currentStatus === STATUS.PLAYING) {
      console.log('🎵 Музыка уже играет, не отправляем команду');
      return { success: true, message: '▶️ Музыка уже играет' };
    }

    // Отправляем Play/Pause только если не играет
    await execNircmdHidden('nircmd sendkeypress 0xB3');
    console.log('✅ Play отправлен через nircmd');
    return { success: true, message: '▶️ Воспроизведение' };
  } catch (error) {
    console.error('❌ Ошибка воспроизведения:', error);
    return { success: false, message: '❌ Ошибка воспроизведения', error: error.message };
  }
}

export async function pauseAudio() {
  try {
    // Проверяем текущий статус
    const currentStatus = await getPlaybackStatus();

    if (currentStatus === STATUS.PAUSED || currentStatus === STATUS.STOPPED) {
      console.log('🎵 Музыка уже на паузе, не отправляем команду');
      return { success: true, message: '⏸️ Музыка уже на паузе' };
    }

    // Отправляем Play/Pause только если играет
    await execNircmdHidden('nircmd sendkeypress 0xB3');
    console.log('✅ Pause отправлен через nircmd');
    return { success: true, message: '⏸️ Пауза' };
  } catch (error) {
    console.error('❌ Ошибка паузы:', error);
    return { success: false, message: '❌ Ошибка паузы', error: error.message };
  }
}

export async function nextTrack() {
  try {
    await execNircmdHidden('nircmd sendkeypress 0xB0');
    console.log('✅ Следующий трек через nircmd');
    return { success: true, message: '⏭️ Следующий трек' };
  } catch (error) {
    console.error('❌ Ошибка следующего трека:', error);
    return { success: false, message: '❌ Ошибка следующего трека', error: error.message };
  }
}

export async function previousTrack() {
  try {
    await execNircmdHidden('nircmd sendkeypress 0xB1');
    console.log('✅ Предыдущий трек через nircmd');
    return { success: true, message: '⏮️ Предыдущий трек' };
  } catch (error) {
    console.error('❌ Ошибка предыдущего трека:', error);
    return { success: false, message: '❌ Ошибка предыдущего трека', error: error.message };
  }
}

export async function microphoneOn() {
  // Заглушка - управление микрофоном отключено для Windows
  console.log('🎤 Микрофон "включен" (заглушка)');
  return { success: true, message: '🎤 Микрофон включен' };
}

export async function microphoneOff() {
  // Заглушка - управление микрофоном отключено для Windows
  console.log('🎤 Микрофон "выключен" (заглушка)');
  return { success: true, message: '🎤 Микрофон выключен' };
}

// Системные операции через nircmd
export async function displayOff() {
  try {
    await execNircmdHidden('nircmd monitor off');
    console.log('✅ Дисплей выключен через nircmd');
    return { success: true, message: '🖥️ Дисплей выключен' };
  } catch (error) {
    console.error('❌ Ошибка выключения дисплея:', error);
    return { success: false, message: '❌ Ошибка выключения дисплея', error: error.message };
  }
}

export async function suspendSystem() {
  try {
    await execNircmdHidden('nircmd standby');
    console.log('✅ Система переведена в спящий режим через nircmd');
    return { success: true, message: '💤 Система переведена в спящий режим' };
  } catch (error) {
    console.error('❌ Ошибка перевода в спящий режим:', error);
    return { success: false, message: '❌ Ошибка перевода в спящий режим', error: error.message };
  }
}

export async function rebootSystem() {
  try {
    await execNircmdHidden('nircmd exitwin reboot');
    console.log('✅ Перезагрузка системы через nircmd');
    return { success: true, message: '🔄 Система перезагружается' };
  } catch (error) {
    console.error('❌ Ошибка перезагрузки:', error);
    return { success: false, message: '❌ Ошибка перезагрузки системы', error: error.message };
  }
}

// Очистка временных файлов через nircmd
export async function cleanupTempFiles(filepaths) {
  try {
    for (const filepath of filepaths) {
      await execNircmdHidden(`nircmd deletefile "${filepath}"`);
      console.log(`✅ Файл удален: ${filepath}`);
    }
    return { success: true, message: `🗑️ Удалено файлов: ${filepaths.length}` };
  } catch (error) {
    return { success: false, message: '❌ Ошибка удаления файлов', error: error.message };
  }
}

// Функция для получения информации о системе
export async function getSystemInfo() {
  console.log('📊 Получение системной информации...');
  const startTime = performance.now();

  try {
    // Измеряем время выполнения каждого компонента
    const componentTimings = {};

    const measureComponent = async (func, name) => {
      const compStart = performance.now();
      try {
        const result = await func();
        const compEnd = performance.now();
        componentTimings[name] = (compEnd - compStart).toFixed(2);
        console.log(`⏱️ ${name}: ${componentTimings[name]}ms`);
        return result;
      } catch (error) {
        const compEnd = performance.now();
        componentTimings[name] = (compEnd - compStart).toFixed(2);
        console.log(`⏱️ ${name}: ${componentTimings[name]}ms (ОШИБКА)`);
        throw error;
      }
    };

    const [cpu, mem, osInfo, system, graphics] = await Promise.all([
      measureComponent(() => si.cpu(), 'si.cpu'),
      measureComponent(() => si.mem(), 'si.mem'),
      measureComponent(() => si.osInfo(), 'si.osInfo'),
      measureComponent(() => si.system(), 'si.system'),
      measureComponent(() => si.graphics(), 'si.graphics'),
    ]);

    // Получаем загрузку CPU и время работы
    const cpuLoad = await measureComponent(() => si.currentLoad(), 'si.currentLoad');
    const uptimeStart = performance.now();
    const uptimeSeconds = os.uptime();
    const formattedUptime = formatUptime(uptimeSeconds);
    const uptimeEnd = performance.now();
    componentTimings['os.uptime + formatUptime'] = (uptimeEnd - uptimeStart).toFixed(2);
    console.log(`⏱️ os.uptime + formatUptime: ${componentTimings['os.uptime + formatUptime']}ms`);

    // Расчет памяти
    const memCalcStart = performance.now();
    const totalMemGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
    const freeMemGB = (mem.free / 1024 / 1024 / 1024).toFixed(1);
    const usedMemGB = ((mem.total - mem.free) / 1024 / 1024 / 1024).toFixed(1);
    const memUsagePercent = (((mem.total - mem.free) / mem.total) * 100).toFixed(1);
    const memCalcEnd = performance.now();
    componentTimings['memory calculations'] = (memCalcEnd - memCalcStart).toFixed(2);
    console.log(`⏱️ memory calculations: ${componentTimings['memory calculations']}ms`);

    // Получаем информацию о скорости использования сети за 5 секунд
    const networkSpeed = await measureComponent(() => getNetworkSpeed(), 'getNetworkSpeed');

    // Показываем общую статистику производительности
    const totalTime = (performance.now() - startTime).toFixed(2);
    console.log('📈 Статистика производительности getSystemInfo:');
    console.log(`   Общее время: ${totalTime}ms`);
    Object.entries(componentTimings).forEach(([name, time]) => {
      const percentage = ((parseFloat(time) / parseFloat(totalTime)) * 100).toFixed(1);
      console.log(`   ${name}: ${time}ms (${percentage}%)`);
    });

    // Определяем самый медленный компонент
    if (Object.keys(componentTimings).length > 0) {
      const slowestComp = Object.entries(componentTimings).reduce((a, b) =>
        parseFloat(a[1]) > parseFloat(b[1]) ? a : b
      );
      console.log(`🐌 Самый медленный компонент: ${slowestComp[0]} (${slowestComp[1]}ms)`);
    }

    console.log('✅ Системная информация получена');

    return SYSTEM_INFO_TEMPLATE({
      motherboard: `${system.manufacturer} ${system.model}`,
      cpu: `${cpu.manufacturer} ${cpu.brand}`,
      cores: `${cpu.cores} (${cpu.physicalCores} физических)`,
      graphics: graphics.controllers.map((gpu) => `${gpu.vendor} ${gpu.model}`).join(', '),
      os: `${osInfo.distro} ${osInfo.release}`,
      arch: osInfo.arch,
      kernel: osInfo.kernel,
      cpuLoad: `${cpuLoad.currentLoad.toFixed(1)}%`,
      memory: `${usedMemGB} GB / ${totalMemGB} GB (${memUsagePercent}%)`,
      availableMemory: `${freeMemGB} GB`,
      uptime: formattedUptime,
      networkSpeed: networkSpeed,
    });
  } catch (error) {
    const totalTime = (performance.now() - startTime).toFixed(2);
    console.error(`❌ Ошибка получения системной информации (${totalTime}ms):`, error);
    throw new Error(`Ошибка получения информации о системе: ${error.message}`);
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

// Функция для проверки и создания директории хранения через Node.js fs
export async function ensureStorageDirectory() {
  if (!env.STORAGE_PATH) {
    return {
      success: false,
      error: ERRORS.STORAGE_PATH_NOT_SET,
    };
  }

  try {
    // Проверяем существование директории через Node.js fs
    if (!fs.existsSync(env.STORAGE_PATH)) {
      fs.mkdirSync(env.STORAGE_PATH, { recursive: true });
      console.log(`✅ Директория создана: ${env.STORAGE_PATH}`);
    }

    return {
      success: true,
      path: env.STORAGE_PATH.replace(/[\\\/]+$/, ''), // Убираем trailing слеши
    };
  } catch (error) {
    console.error('❌ Ошибка создания директории:', error);
    return {
      success: false,
      error: ERROR_TEMPLATES.STORAGE_DIRECTORY_CREATE_ERROR(error.message),
    };
  }
}

// Функция для установки правильного владельца файла (в Windows не нужно)
export async function setFileOwnership(filePath) {
  // В Windows права на файлы управляются по-другому
  // Эта функция оставлена для совместимости, но ничего не делает
  return;
}
