import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import os from 'os';
import path from 'path';

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
    const { stdout, stderr } = await execAsync(command, { shell: 'powershell.exe' });
    console.log(CONSOLE_MESSAGES.COMMAND_SUCCESS(description, command));
    if (stderr) console.warn(CONSOLE_MESSAGES.COMMAND_WARNING(stderr));
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    console.error(CONSOLE_MESSAGES.COMMAND_FAILED(description, error.message));
    return { success: false, error: error.message };
  }
}

// Функция для выполнения аудио команд через PowerShell
export async function executeAudioCommand(command, description) {
  try {
    const { stdout, stderr } = await execAsync(command, { shell: 'powershell.exe' });
    console.log(CONSOLE_MESSAGES.COMMAND_SUCCESS(description, command));
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
    const command = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
          [DllImport("winmm.dll")]
          public static extern int waveOutGetVolume(IntPtr hwo, out uint dwVolume);
        }
'@
      [Audio]::waveOutGetVolume([IntPtr]::Zero, [ref]$vol)
      $left = [int]($vol -band 0xFFFF)
      $right = [int]($vol -shr 16)
      $volume = [math]::Round(($left + $right) / 2 / 655.35)
      Write-Output $volume
    `;
    
    const result = await executeAudioCommand(command, COMMAND_DESCRIPTIONS.GET_VOLUME);
    if (result.success && result.output.trim()) {
      return result.output.trim() + '%';
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    return STATUS.UNKNOWN;
  }
}

// Функция для получения статуса mute
export async function getMuteStatus() {
  try {
    const command = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Audio {
          [DllImport("winmm.dll")]
          public static extern int waveOutGetVolume(IntPtr hwo, out uint dwVolume);
        }
'@
      [Audio]::waveOutGetVolume([IntPtr]::Zero, [ref]$vol)
      if ($vol -eq 0) { Write-Output "muted" } else { Write-Output "unmuted" }
    `;
    
    const result = await executeAudioCommand(command, COMMAND_DESCRIPTIONS.GET_MUTE_STATUS);
    if (result.success) {
      return result.output.trim().includes('muted') ? STATUS.DISABLED : STATUS.ENABLED;
    }
    return STATUS.UNKNOWN;
  } catch (error) {
    return STATUS.UNKNOWN;
  }
}

// Функция для получения информации о текущем треке
export async function getCurrentTrack() {
  try {
    const command = `
      $sessions = Get-AudioSession
      foreach ($session in $sessions) {
        if ($session.State -eq 'AudioSessionStateActive') {
          $process = Get-Process -Id $session.ProcessId -ErrorAction SilentlyContinue
          if ($process) {
            Write-Output "$($process.ProcessName) - $($process.MainWindowTitle)"
          }
        }
      }
    `;
    
    const result = await executeAudioCommand(command, COMMAND_DESCRIPTIONS.GET_TRACK_INFO);
    if (result.success && result.output.trim()) {
      return result.output.trim();
    }
    return STATUS.NOTHING_PLAYING;
  } catch (error) {
    return STATUS.NOTHING_PLAYING;
  }
}

// Функция для получения статуса воспроизведения
export async function getPlaybackStatus() {
  try {
    const command = `
      $playing = $false
      Get-Process | Where-Object { $_.ProcessName -match "spotify|vlc|winamp|foobar|musicbee" } | ForEach-Object {
        if ($_.MainWindowTitle -and $_.MainWindowTitle -ne "") {
          $playing = $true
        }
      }
      if ($playing) { Write-Output "playing" } else { Write-Output "stopped" }
    `;
    
    const result = await executeAudioCommand(command, COMMAND_DESCRIPTIONS.GET_PLAYBACK_STATUS);
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
    const command = `
      Add-Type -AssemblyName System.Windows.Forms
      $mic = Get-WmiObject -Class Win32_SoundDevice | Where-Object { $_.Name -like "*microphone*" }
      if ($mic) { Write-Output "enabled" } else { Write-Output "disabled" }
    `;
    
    const result = await executeAudioCommand(command, COMMAND_DESCRIPTIONS.GET_MICROPHONE_STATUS);
    if (result.success) {
      return result.output.trim().includes('enabled') ? STATUS.ENABLED : STATUS.DISABLED;
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

// Функция для получения сетевой скорости
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

    // Ждем 2 секунды для замера скорости
    await sleep(2000);

    // Получаем статистику через 2 секунды
    const stats2 = await si.networkStats(activeInterface.iface);

    if (stats1.length > 0 && stats2.length > 0) {
      const timeDiff = 2; // 2 секунды
      const rxSpeed = (stats2[0].rx_bytes - stats1[0].rx_bytes) / timeDiff; // байт/сек
      const txSpeed = (stats2[0].tx_bytes - stats1[0].tx_bytes) / timeDiff; // байт/сек

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
    
    const command = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      
      $screens = [System.Windows.Forms.Screen]::AllScreens
      $screenshots = @()
      
      for ($i = 0; $i -lt $screens.Length; $i++) {
        $screen = $screens[$i]
        $bounds = $screen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)
        
        $filename = "screenshot_$i_${timestamp}.png"
        $filepath = Join-Path (Get-Location) $filename
        $bitmap.Save($filepath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $screenshots += $filepath
        Write-Output "Создан скриншот: $filepath"
        
        $graphics.Dispose()
        $bitmap.Dispose()
      }
      
      Write-Output "Скриншоты сохранены:"
      $screenshots | ForEach-Object { Write-Output $_ }
    `;

    const result = await executeCommand(command, COMMAND_DESCRIPTIONS.TAKE_SCREENSHOTS);
    
    if (result.success) {
      const lines = result.output.split('\n').filter(line => line.trim());
      const screenshotPaths = lines.filter(line => line.includes('screenshot_'));
      
      const screenshots = screenshotPaths.map((filepath, index) => ({
        path: filepath.trim(),
        caption: SCREENSHOT_CAPTION_TEMPLATE(index + 1, screenshotPaths.length),
      }));

      return {
        success: true,
        screenshots: screenshots,
        message: `✅ Создано ${screenshots.length} скриншотов`,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  } catch (error) {
    console.error(CONSOLE_MESSAGES.SCREENSHOTS_ERROR_LOG(error));
    return {
      success: false,
      error: ERRORS.SCREENSHOTS_ERROR,
    };
  }
}

// Высокоуровневые операции для аудио
export async function soundOn() {
  const command = `
    Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      public class Audio {
        [DllImport("winmm.dll")]
        public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);
      }
'@
    [Audio]::waveOutSetVolume([IntPtr]::Zero, 0xFFFFFFFF)
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.ENABLE_SOUND);
}

export async function soundOff() {
  const command = `
    Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      public class Audio {
        [DllImport("winmm.dll")]
        public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);
      }
'@
    [Audio]::waveOutSetVolume([IntPtr]::Zero, 0x00000000)
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.DISABLE_SOUND);
}

export async function playAudio() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{MEDIA_PLAY_PAUSE}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.START_PLAYBACK);
}

export async function pauseAudio() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{MEDIA_PLAY_PAUSE}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.PAUSE_PLAYBACK);
}

export async function nextTrack() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{MEDIA_NEXT_TRACK}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.NEXT_TRACK);
}

export async function previousTrack() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{MEDIA_PREV_TRACK}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.PREVIOUS_TRACK);
}

export async function volumeUp() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{VOLUME_UP}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.INCREASE_VOLUME);
}

export async function volumeDown() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{VOLUME_DOWN}")
  `;
  
  return await executeAudioCommand(command, COMMAND_DESCRIPTIONS.DECREASE_VOLUME);
}

export async function microphoneOn() {
  // Windows не имеет простого способа управления микрофоном через PowerShell
  // Это требует более сложной реализации через Windows API
  return {
    success: false,
    error: 'Управление микрофоном пока не поддерживается в Windows версии'
  };
}

export async function microphoneOff() {
  // Windows не имеет простого способа управления микрофоном через PowerShell
  // Это требует более сложной реализации через Windows API
  return {
    success: false,
    error: 'Управление микрофоном пока не поддерживается в Windows версии'
  };
}

// Системные операции
export async function displayOff() {
  const command = `
    Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      public class Display {
        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int hMsg, int wParam, int lParam);
        [DllImport("user32.dll")]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
      }
'@
    $HWND_BROADCAST = [IntPtr] 0xFFFF
    $WM_SYSCOMMAND = 0x0112
    $SC_MONITORPOWER = 0xF170
    $MONITOR_OFF = 2
    [Display]::SendMessage($HWND_BROADCAST, $WM_SYSCOMMAND, $SC_MONITORPOWER, $MONITOR_OFF)
  `;
  
  return await executeCommand(command, COMMAND_DESCRIPTIONS.TURN_OFF_DISPLAY);
}

export async function suspendSystem() {
  const command = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)
  `;
  
  return await executeCommand(command, COMMAND_DESCRIPTIONS.SUSPEND_SYSTEM);
}

export async function rebootSystem() {
  const command = `Restart-Computer -Force`;
  return await executeCommand(command, COMMAND_DESCRIPTIONS.REBOOT_SYSTEM);
}

// Очистка временных файлов
export async function cleanupTempFiles(filepaths) {
  try {
    for (const filepath of filepaths) {
      await executeCommand(`Remove-Item -Path "${filepath}" -Force`, COMMAND_DESCRIPTIONS.DELETE_FILE(filepath));
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

    // Расчет памяти
    const totalMemGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
    const freeMemGB = (mem.free / 1024 / 1024 / 1024).toFixed(1);
    const usedMemGB = ((mem.total - mem.free) / 1024 / 1024 / 1024).toFixed(1);
    const memUsagePercent = (((mem.total - mem.free) / mem.total) * 100).toFixed(1);

    // Получаем сетевую скорость
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
      memory: `${usedMemGB} GB / ${totalMemGB} GB (${memUsagePercent}%)`,
      availableMemory: `${freeMemGB} GB`,
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
    const command = `
      if (-not (Test-Path "${env.STORAGE_PATH}")) {
        New-Item -ItemType Directory -Path "${env.STORAGE_PATH}" -Force
      }
      Write-Output "${env.STORAGE_PATH}"
    `;
    
    const result = await executeCommand(command, 'Создание директории хранения');
    
    if (result.success) {
      return {
        success: true,
        path: env.STORAGE_PATH.replace(/[\\\/]+$/, ''), // Убираем trailing слеши
      };
    }
    
    return {
      success: false,
      error: ERROR_TEMPLATES.STORAGE_DIRECTORY_CREATE_ERROR(result.error),
    };
  } catch (error) {
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