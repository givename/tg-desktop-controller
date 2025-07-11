// Текст справки
export const HELP_TEXT = `*Аудио управление:*
🔊 Звук вкл/выкл - включение и выключение звука
🔉 Тише / 🔊 Громче - регулировка громкости
▶️ Играть / ⏸️ Пауза - управление воспроизведением
⏮️ Предыдущий / ⏭️ Следующий - переключение треков

*Микрофон:*
🎤 Микрофон вкл/выкл - управление микрофоном

*Система:*
💻 Выкл дисплей - выключить экран
😴 Сон - перевести компьютер в режим сна
🔄 Перезагрузка - перезагрузить компьютер
📸 Скриншот - сделать снимок экрана
ℹ️ Инфо - информация о системе
⏱️ Uptime - время работы бота и системы

*Файлы:*
📎 Отправьте боту файл или фото, и он сохранит его в указанную директорию

*Утилиты:*
⌨️ /keyboard - восстановить клавиатуру (если она исчезла)

*Команды:* /start, /help, /keyboard, /soundon, /soundoff, /microphoneon, /microphoneoff, /play, /pause, /next, /prev, /volume_up, /volume_down, /displayoff, /reboot, /suspend, /ping, /info, /uptime, /screenshot
`;

// Сообщения об ошибках
export const ERRORS = {
  NO_ACCESS: '❌ У вас нет доступа к этому боту',
  MISSING_USER_ENV: 'Не заданы переменные окружения LINUX_USER_ID и LINUX_USER_NAME',
  STORAGE_PATH_NOT_SET: 'Путь для сохранения файлов не указан. Добавьте STORAGE_PATH в файл .env',
  STORAGE_DIRECTORY_ERROR: 'Ошибка создания директории',
  SCROT_NOT_INSTALLED:
    'Утилита scrot не установлена. Установите её командой: sudo apt-get install scrot',
  MONITORS_NOT_DETECTED: 'Не удалось определить мониторы',
  NO_SCREENSHOTS_CREATED: 'Не удалось создать скриншоты мониторов',
  ACTIVE_INTERFACE_NOT_FOUND: 'Активный интерфейс не найден',
  NETWORK_SPEED_MEASUREMENT_FAILED: 'Не удалось измерить скорость',
  NETWORK_SPEED_ERROR: 'Ошибка измерения скорости',
  SYSTEM_INFO_ERROR: 'Ошибка получения информации о системе',
  PHOTO_PROCESSING_ERROR: 'Произошла ошибка при обработке фото',
  FILE_PROCESSING_ERROR: 'Произошла ошибка при обработке файла',
  SCREENSHOT_SEND_ERROR: 'Ошибка отправки скриншотов',
  SCREENSHOTS_ERROR: 'Ошибка создания скриншотов',
  INVALID_CONFIRMATION_CODE: 'Неверный код подтверждения',
};

// Шаблоны сообщений об ошибках с параметрами
export const ERROR_TEMPLATES = {
  AUDIO_COMMAND_FAILED: (description, error) => `❌ ${description} не удалось: ${error}`,
  SYSTEM_COMMAND_FAILED: (description, error) => `❌ ${description} не удалось: ${error}`,
  SOUND_ON_ERROR: (error) => `❌ Ошибка включения звука: ${error}`,
  SOUND_OFF_ERROR: (error) => `❌ Ошибка выключения звука: ${error}`,
  PLAY_ERROR: (error) => `❌ Ошибка воспроизведения: ${error}`,
  PAUSE_ERROR: (error) => `❌ Ошибка паузы: ${error}`,
  NEXT_TRACK_ERROR: (error) => `❌ Ошибка переключения: ${error}`,
  PREV_TRACK_ERROR: (error) => `❌ Ошибка переключения: ${error}`,
  VOLUME_ERROR: (error) => `❌ Ошибка изменения громкости: ${error}`,
  MICROPHONE_ON_ERROR: (error) => `❌ Ошибка включения микрофона: ${error}`,
  MICROPHONE_OFF_ERROR: (error) => `❌ Ошибка выключения микрофона: ${error}`,
  DISPLAY_OFF_ERROR: (error) => `❌ Ошибка выключения дисплея: ${error}`,
  SUSPEND_ERROR: (error) => `❌ Ошибка перевода в режим сна: ${error}`,
  REBOOT_ERROR: (error) => `❌ Ошибка перезагрузки: ${error}`,
  SCREENSHOT_ERROR: (error) => `❌ Ошибка создания скриншотов: ${error}`,
  FILE_SAVE_ERROR: (error) => `❌ Ошибка сохранения файла: ${error}`,
  STORAGE_DIRECTORY_CREATE_ERROR: (error) => `Ошибка создания директории: ${error}`,
  GENERIC_ERROR: (error) => `❌ Ошибка: ${error}`,
};

// Успешные сообщения
export const SUCCESS_MESSAGES = {
  SOUND_ON: '🔊 Звук включен',
  SOUND_OFF: '🔇 Звук выключен',
  PLAY_STARTED: '▶️ Воспроизведение запущено',
  PLAY_PAUSED: '⏸️ Воспроизведение приостановлено',
  NEXT_TRACK: '⏭️ Переключено на следующий трек',
  PREV_TRACK: '⏮️ Переключено на предыдущий трек',
  VOLUME_UP: '🔊 Громкость увеличена на 5%',
  VOLUME_DOWN: '🔉 Громкость уменьшена на 5%',
  MICROPHONE_ON: '🎤 Микрофон включен',
  MICROPHONE_OFF: '🎤 Микрофон выключен',
  DISPLAY_OFF: '💻 Дисплей выключен',
  CONFIRMATION_ACCEPTED: '✅ Код подтвержден.',
  PHOTO_SAVED: '✅ Фото сохранено',
  FILE_SAVED: '✅ Файл сохранен',
};

// Информационные сообщения
export const INFO_MESSAGES = {
  GETTING_SYSTEM_INFO: '📊 Получаю информацию о системе...',
  REBOOT_CONFIRMATION: '🔄 *Подтверждение перезагрузки*',
  SUSPEND_CONFIRMATION: '😴 *Подтверждение режима сна*',
  COMPUTER_WILL_REBOOT: '⚠️ *Внимание:* Компьютер будет перезагружен!',
  COMPUTER_WILL_SUSPEND: '⚠️ *Внимание:* Компьютер будет переведен в режим сна!',
  CODE_VALID_TIME: '_Код действителен 5 минут._',
  REBOOTING_COMPUTER: 'Перезагружаем компьютер...',
  SUSPENDING_COMPUTER: 'Переводим компьютер в режим сна...',
};

// Статусы
export const STATUS = {
  UNKNOWN: 'Неизвестно',
  ENABLED: 'Включен',
  DISABLED: 'Выключен',
  PLAYING: 'Играет',
  PAUSED: 'На паузе',
  STOPPED: 'Остановлено',
  NOTHING_PLAYING: 'Ничего не воспроизводится',
  TRACK_UNDETERMINED: 'Неопределяемый',
};

// Приветственное сообщение
export const WELCOME_MESSAGE = `🖥️ *Добро пожаловать в Desktop Controller Bot!*

Используйте кнопки ниже для управления компьютером или введите команды:
/soundon, /soundoff, /play, /pause, /next, /prev, /volume_up, /volume_down, /suspend, /servermode, /ping, /info, /help`;

// Шаблоны для системной информации
export const SYSTEM_INFO_TEMPLATE = (data) => `🖥️ *Информация о системе*

*🖥️ АППАРАТНАЯ ЧАСТЬ*
🔧 Материнская плата: ${data.motherboard}
⚙️ Процессор: ${data.cpu}
🔢 Ядер: ${data.cores}
🎮 Видеокарта: ${data.graphics}

*💻 ОПЕРАЦИОННАЯ СИСТЕМА*
📋 ОС: ${data.os}
🏗️ Архитектура: ${data.arch}
⚙️ Ядро: ${data.kernel}

*📊 СТАТИСТИКА СИСТЕМЫ*
🖥️ Загрузка CPU: ${data.cpuLoad}
💾 Память: ${data.memory}
💚 Доступно: ${data.availableMemory}
⏰ Время работы: ${data.uptime}
🌐 Сеть: ${data.networkSpeed}`;

// Шаблон для аудио информации
export const AUDIO_INFO_TEMPLATE = (data) => `🔊 Звук: ${data.soundStatus} (${data.volume})
🎤 Микрофон: ${data.microphoneStatus}
🎵 Статус: ${data.playbackStatus}
🎶 Трек: ${data.currentTrack}`;

// Шаблон для подтверждения действий
export const CONFIRMATION_TEMPLATE = (action, code, warning, description) =>
  `${action}\n\nВведите код подтверждения: \`${code}\`\n\n${warning}\n\n${description}`;

// Шаблон для сохранения файлов
export const FILE_SAVE_TEMPLATE = (path, size) => `📁 Путь: \`${path}\`\n📊 Размер: ${size}`;

// Шаблон для pong сообщения
export const PONG_TEMPLATE = (responseTime) => `🏓 Pong! ⚡ Время отклика: ${responseTime}ms`;

// Шаблон для скриншота монитора
export const SCREENSHOT_CAPTION_TEMPLATE = (display, current, total) =>
  `📸 Монитор ${display} (${current} из ${total})`;

// Шаблон для сетевой скорости
export const NETWORK_SPEED_TEMPLATE = (upload, download) => `📤 ↑ ${upload}\n📥 ↓ ${download}`;

// Константы кнопок клавиатуры
export const KEYBOARD_BUTTONS = {
  VOLUME_DOWN: '🔉 Тише',
  VOLUME_UP: '🔊 Громче',
  SOUND_ON: '🔊 Звук вкл',
  SOUND_OFF: '🔇 Звук выкл',
  PLAY: '▶️ Играть',
  PAUSE: '⏸️ Пауза',
  PREV_TRACK: '⏮️ Предыдущий',
  NEXT_TRACK: '⏭️ Следующий',
  MICROPHONE_ON: '🎤 Микрофон вкл',
  MICROPHONE_OFF: '🎤 Микрофон выкл',
  SCREENSHOT: '📸 Скриншот',
  INFO: 'ℹ️ Инфо',
  UPTIME: '⏱️ Uptime',
  DISPLAY_OFF: '💻 Выкл дисплей',
  SUSPEND: '😴 Сон',
  REBOOT: '🔄 Перезагрузка',
  HELP: '❓ Помощь',
  PING: '🏓 Пинг',
};

// Клавиатура по умолчанию
export const DEFAULT_KEYBOARD = {
  keyboard: [
    [KEYBOARD_BUTTONS.VOLUME_DOWN, KEYBOARD_BUTTONS.VOLUME_UP],
    [KEYBOARD_BUTTONS.SOUND_ON, KEYBOARD_BUTTONS.SOUND_OFF],
    [KEYBOARD_BUTTONS.PLAY, KEYBOARD_BUTTONS.PAUSE],
    [KEYBOARD_BUTTONS.PREV_TRACK, KEYBOARD_BUTTONS.NEXT_TRACK],
    [KEYBOARD_BUTTONS.MICROPHONE_ON, KEYBOARD_BUTTONS.MICROPHONE_OFF],
    [KEYBOARD_BUTTONS.SCREENSHOT, KEYBOARD_BUTTONS.INFO],
    [KEYBOARD_BUTTONS.UPTIME, KEYBOARD_BUTTONS.PING],
    [KEYBOARD_BUTTONS.DISPLAY_OFF, KEYBOARD_BUTTONS.SUSPEND],
    [KEYBOARD_BUTTONS.REBOOT, KEYBOARD_BUTTONS.HELP],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// Сообщения об ошибках для логирования
export const ERROR_LOG_MESSAGES = {
  COMMAND_START: 'Ошибка в команде /start:',
  COMMAND_HELP: 'Ошибка в команде /help:',
  COMMAND_SOUNDON: 'Ошибка в команде /soundon:',
  COMMAND_SOUNDOFF: 'Ошибка в команде /soundoff:',
  COMMAND_PLAY: 'Ошибка в команде /play:',
  COMMAND_PAUSE: 'Ошибка в команде /pause:',
  COMMAND_NEXT: 'Ошибка в команде /next:',
  COMMAND_PREV: 'Ошибка в команде /prev:',
  COMMAND_VOLUME_UP: 'Ошибка в команде /volume_up:',
  COMMAND_VOLUME_DOWN: 'Ошибка в команде /volume_down:',
  COMMAND_MICROPHONEON: 'Ошибка в команде /microphoneon:',
  COMMAND_MICROPHONEOFF: 'Ошибка в команде /microphoneoff:',
  MESSAGE_PROCESSING: 'Ошибка в обработке сообщения:',
  KEYBOARD_BUTTON_PROCESSING: 'Ошибка в обработке кнопки клавиатуры:',
  REBOOT_BUTTON_HANDLER: 'Ошибка в handleRebootButton:',
  SUSPEND_BUTTON_HANDLER: 'Ошибка в handleSuspendButton:',
  INFO_BUTTON_HANDLER: 'Ошибка в handleInfoButton:',
  SCREENSHOT_BUTTON_HANDLER: 'Ошибка в handleScreenshotButton:',
  COMMAND_SUSPEND: 'Ошибка в команде /suspend:',
  COMMAND_REBOOT: 'Ошибка в команде /reboot:',
  COMMAND_DISPLAYOFF: 'Ошибка в команде /displayoff:',
  COMMAND_PING: 'Ошибка в команде /ping:',
  COMMAND_INFO: 'Ошибка в команде /info:',
  COMMAND_UPTIME: 'Ошибка в команде /uptime:',
  UPTIME_BUTTON_HANDLER: 'Ошибка в handleUptimeButton:',
  COMMAND_SCREENSHOT: 'Ошибка в команде /screenshot:',
};

// Сообщения об ошибках системы
export const SYSTEM_ERROR_MESSAGES = {
  UNSUPPORTED_PLATFORM: (platform) => `Платформа ${platform} не поддерживается`,
};

// Сообщения валидации окружения
export const ENV_VALIDATION_MESSAGES = {
  MISSING_REQUIRED_VARS: '❌ Отсутствуют обязательные переменные окружения:',
  CREATE_ENV_FILE: '\nСоздайте файл .env на основе env.example',
  VALIDATION_SUCCESS: '✅ Переменные окружения загружены успешно',
};

// Описания команд для логирования (Linux специфичные)
export const COMMAND_DESCRIPTIONS = {
  GET_VOLUME: 'Получение громкости',
  GET_MUTE_STATUS: 'Получение статуса mute',
  GET_TRACK_INFO: 'Получение информации о треке',
  GET_PLAYBACK_STATUS: 'Получение статуса воспроизведения',
  GET_MICROPHONE_STATUS: 'Получение статуса микрофона',
  ENABLE_SOUND: 'Включение звука',
  DISABLE_SOUND: 'Выключение звука',
  START_PLAYBACK: 'Запуск воспроизведения',
  PAUSE_PLAYBACK: 'Пауза воспроизведения',
  NEXT_TRACK: 'Переключение на следующий трек',
  PREVIOUS_TRACK: 'Переключение на предыдущий трек',
  INCREASE_VOLUME: 'Увеличение громкости',
  DECREASE_VOLUME: 'Уменьшение громкости',
  ENABLE_MICROPHONE: 'Включение микрофона',
  DISABLE_MICROPHONE: 'Выключение микрофона',
  TURN_OFF_DISPLAY: 'Выключение дисплея',
  SUSPEND_SYSTEM: 'Перевод в режим сна',
  REBOOT_SYSTEM: 'Перезагрузка системы',
  DELETE_FILE: (filepath) => `Удаление файла ${filepath}`,
  TAKE_SCREENSHOTS: 'Создание скриншотов',
};

// Системные команды и их параметры
export const SYSTEM_COMMANDS = {
  GET_TRACK_METADATA:
    'playerctl metadata --format "{{artist}} - {{title}}" 2>/dev/null || echo "Ничего не воспроизводится"',
  GET_PLAYBACK_STATUS: 'playerctl status 2>/dev/null || echo "Stopped"',
  NOTHING_PLAYING_FALLBACK: 'Ничего не воспроизводится',
};

// Консольные сообщения
export const CONSOLE_MESSAGES = {
  BOT_STARTED: '🚀 Telegram Desktop Controller Bot запущен!',
  AVAILABLE_COMMANDS:
    '📋 Доступные команды: /start, /help, /keyboard, /soundon, /soundoff, /pause, /play, /next, /prev, /volume_up, /volume_down, /suspend, /ping, /info',
  KEYBOARD_HELP:
    '🎹 Клавиатура: 🔊 Звук вкл/выкл, ▶️⏸️ Play/Pause, ⏮️⏭️ Prev/Next, 🔉🔊 Тише/Громче, 😴 Сон, 🏓 Ping, ℹ️ Инфо, ❓ Помощь',
  COMMAND_SUCCESS: (description, command) => `✅ ${description}: ${command}`,
  COMMAND_WARNING: (stderr) => `⚠️ Warning: ${stderr}`,
  COMMAND_FAILED: (description, error) => `❌ ${description} failed: ${error}`,
  BOT_ERROR: (error) => `❌ Ошибка бота: ${error}`,
  POLLING_ERROR: (error) => `❌ Ошибка polling: ${error}`,
  SIGINT_RECEIVED: '\n🛑 Получен сигнал SIGINT, завершаем работу бота...',
  SIGTERM_RECEIVED: '\n🛑 Получен сигнал SIGTERM, завершаем работу бота...',
  MARKDOWN_PARSE_FAILED: (error) => `Markdown parsing failed, sending as plain text: ${error}`,
  PLAIN_TEXT_FAILED: (error) => `Failed to send message even as plain text: ${error}`,
  FILE_PROCESSING_ERROR_LOG: (error) => `Ошибка при обработке фото: ${error}`,
  DOCUMENT_PROCESSING_ERROR_LOG: (error) => `Ошибка при обработке документа: ${error}`,
  CHOWN_WARNING: (error) => `Не удалось изменить владельца файла: ${error}`,
  NETWORK_SPEED_ERROR_LOG: (error) => `Ошибка получения сетевой скорости: ${error}`,
  SYSTEM_INFO_ERROR_LOG: (error) => `Ошибка получения системной информации: ${error}`,
  FILE_SAVE_ERROR_LOG: (error) => `Ошибка сохранения файла: ${error}`,
  SCREENSHOTS_ERROR_LOG: (error) => `Ошибка создания скриншотов: ${error}`,
};

export const HELP_MESSAGE_TITLE = '🖥️ *Desktop Controller Bot - Справка*';

export const CPU_CORES_TEXT = (cores, physicalCores) => `${cores} (${physicalCores} физических)`;
