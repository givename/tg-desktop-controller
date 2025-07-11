# Telegram Desktop Controller Bot

Telegram бот для управления рабочим столом Linux через системные команды.

## 🚀 Возможности

### 🔊 Управление звуком
- **Включить звук** (`/sound_on`) - Отключает mute
- **Выключить звук** (`/sound_off`) - Включает mute

### 🎵 Управление воспроизведением
- **Пауза** (`/pause`) - Приостанавливает воспроизведение
- **Воспроизведение** (`/play`) - Запускает воспроизведение
- **Следующий трек** (`/next`) - Переключает на следующий трек
- **Предыдущий трек** (`/prev`) - Переключает на предыдущий трек

### 🔉 Управление громкостью
- **Убавить громкость** (`/volume_down`) - Уменьшает на 5%
- **Добавить громкость** (`/volume_up`) - Увеличивает на 5%

### 💤 Системные команды
- **Режим сна** (`/suspend`) - Переводит компьютер в сон (с подтверждением кодом)
- **Пинг** (`/ping`) - Проверка связи с ботом
- **Информация о системе** (`/info`) - Подробная системная информация

## 📋 Требования

### Linux
- **Node.js** версии 18 или выше
- **Linux** с systemd и loginctl (для команд suspend/reboot)
- **PulseAudio** (команды pactl для управления звуком)
- **playerctl** (для управления медиа-плеерами)
- **PM2** (для автозапуска и управления процессом)

### Windows
- **Node.js** версии 18 или выше
- **Windows 10/11** с PowerShell 5.1 или выше
- **NirCmd** (для управления звуком и системой) - **ОБЯЗАТЕЛЬНО!**
- **SoundVolumeCommandLine** (для получения аудио информации) - **ОБЯЗАТЕЛЬНО!**
- **PM2** (для автозапуска и управления процессом)

### 🪟 Установка зависимостей Windows

#### 1. NirSoft утилиты (ОБЯЗАТЕЛЬНО)
**Автоматически устанавливает NirCmd + SoundVolumeCommandLine:**

```powershell
# 🚀 АВТОМАТИЧЕСКАЯ УСТАНОВКА (рекомендуется):
# Требует права администратора!
powershell -ExecutionPolicy Bypass -File scripts/install-deps-windows.ps1
```

#### 2. Что устанавливается:

**NirCmd** - основная утилита для управления системой:
- Управление звуком (mute/unmute, громкость)
- Медиа клавиши (play/pause/next/prev)  
- Скриншоты и системные команды

**SoundVolumeCommandLine (svcl.exe)** - для получения аудио информации:
- Чтение текущей громкости
- Проверка mute статуса
- Управление отдельными приложениями

#### 3. Ручная установка (если нужна):

```powershell
# NirCmd:
# 1. Перейдите на https://www.nirsoft.net/utils/nircmd.html
# 2. Скачайте nircmd.zip, распакуйте nircmd.exe в C:\Windows\System32\

# SoundVolumeCommandLine:
# 1. Перейдите на https://www.nirsoft.net/utils/sound_volume_command_line.html  
# 2. Скачайте svcl.zip, распакуйте svcl.exe в C:\Windows\System32\

# Тестирование:
nircmd.exe mutesysvolume 2
svcl.exe /GetPercent DefaultRenderDevice
```

**📥 Официальные ссылки:**
- **NirCmd:** https://www.nirsoft.net/utils/nircmd.html ([32-bit](https://www.nirsoft.net/utils/nircmd.zip) | [64-bit](https://www.nirsoft.net/utils/nircmd-x64.zip))
- **SoundVolumeCommandLine:** https://www.nirsoft.net/utils/sound_volume_command_line.html ([скачать](https://www.nirsoft.net/utils/svcl.zip))

**❗ ВАЖНО:** Без этих утилит функции управления звуком работать не будут!

#### 2. Node.js и PM2
```powershell
# Установка Node.js (если не установлен)
# Скачайте с https://nodejs.org

# Установка PM2 глобально
npm install -g pm2

# Установка зависимостей проекта
npm install
```

### Установка зависимостей системы Linux

#### 🚀 Автоматическая установка (рекомендуется):
```bash
# Скачайте или клонируйте проект, затем:
sudo ./scripts/install-deps-linux.sh
```
Скрипт автоматически:
- Определит ваш дистрибутив (Ubuntu/Debian/CentOS/Arch/openSUSE)
- Установит все необходимые зависимости
- Настроит Node.js 18+ и PM2
- Проверит работоспособность аудио команд
- Настроит права sudo для системных команд

#### 📋 Ручная установка:

**Ubuntu/Debian:**
```bash
# Основные пакеты
sudo apt update
sudo apt install playerctl pulseaudio-utils

# Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (будет установлен автоматически скриптом)
```

#### Arch Linux:
```bash
sudo pacman -S playerctl pulseaudio
```

## 🏗️ Архитектура

Проект использует модульную архитектуру с четким разделением ответственности:

### Основные компоненты:
- **`index.mjs`** - точка входа, инициализирует все компоненты
- **`tg-bot.instance.mjs`** - создание экземпляра бота и утилитарные функции отправки
- **`tg-bot.logic.mjs`** - логика команд, хуки обработки ошибок и автовосстановление
- **`keyboard.manager.mjs`** - управление состоянием клавиатур для разных чатов
- **`text.provider.mjs`** - все текстовые константы и определения клавиатур

### Принципы разделения:
1. **Единая ответственность** - каждый модуль отвечает за одну область
2. **Слабая связанность** - модули взаимодействуют через четкие интерфейсы
3. **Переиспользование** - утилитарные функции вынесены в отдельные модули

## 📁 Структура проекта

```
tg-desktop-controller/
├── src/                          # Исходный код
│   ├── index.mjs                 # Точка входа - инициализация всех компонентов
│   ├── env.config.mjs           # Конфигурация переменных окружения
│   ├── tg-bot.instance.mjs      # Экземпляр бота и утилитарные функции
│   ├── tg-bot.logic.mjs         # Логика команд + хуки и обработчики ошибок
│   ├── keyboard.manager.mjs     # Управление клавиатурами
│   ├── text.provider.mjs        # Языковые константы и клавиатуры
│   ├── confirmation.manager.mjs  # Управление кодами подтверждения
│   ├── os.controller.mjs        # Контроллер ОС (абстракция)
│   ├── os.linux.controller.mjs  # Linux-специфичные команды
│   └── utils.mjs                # Утилиты
├── scripts/                     # Bash скрипты управления
│   ├── start.sh                 # Запуск бота
│   ├── stop.sh                  # Остановка бота
│   └── restart.sh               # Перезапуск бота
├── logs/                        # Логи (создается автоматически)
├── package.json                 # Зависимости Node.js
├── ecosystem.config.cjs         # Конфигурация PM2
├── .prettierrc                  # Настройки форматирования
├── env.example                  # Пример файла окружения
└── README.md                    # Документация
```

## ⚙️ Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
cd your-project-directory
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните необходимые данные:

```bash
cp .env.example .env
nano .env
```

Заполните файл `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
AUTHORIZED_USER_ID=your_telegram_user_id_here
STORAGE_PATH=/path/to/storage/folder
LINUX_USER_ID=1000
LINUX_USER_NAME=machine
```

**Получение токена бота:**
1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен в `.env`

**Получение User ID:**
1. Напишите [@userinfobot](https://t.me/userinfobot)
2. Скопируйте ваш ID в `.env`

**⚠️ Linux переменные теперь обязательны только на Linux системах** (автоматически проверяется при запуске).

**Переменная STORAGE_PATH (необязательно):**
Путь для сохранения файлов, отправленных боту. Если не указана, функция сохранения файлов будет отключена.

### 🐧 Linux (ВАЖНО - запуск под root)

**⚠️ Бот должен запускаться под root (sudo -i) для корректной работы всех функций!**

Linux переменные обязательны только на Linux системах:

```bash
# Получение данных для .env файла:
id -u your_username    # для LINUX_USER_ID  
whoami                 # для LINUX_USER_NAME

# Пример для пользователя machine с ID 1000:
LINUX_USER_ID=1000
LINUX_USER_NAME=machine
```

**Зачем нужны эти переменные:**
- Бот запускается под root для доступа к системным функциям (suspend, reboot, audio)
- При создании файлов root устанавливает правильного владельца (не root, а обычного пользователя)
- Это обеспечивает безопасность и доступность файлов для пользователя

### 🪟 Windows

Для Windows не требуется дополнительных переменных окружения. Все команды выполняются через PowerShell и NirCmd. Переменные `LINUX_USER_ID` и `LINUX_USER_NAME` игнорируются.

**⚠️ ВАЖНО для Windows:**
- **NirCmd и SoundVolumeCommandLine должны быть установлены** - см. секцию "Установка зависимостей Windows"

**Возможности Windows версии:**
- ✅ Управление звуком (mute/unmute, громкость) - через NirCmd
- ✅ Получение информации о звуке (громкость, статус) - через SoundVolumeCommandLine
- ✅ Управление микрофоном - через NirCmd и WMIC
- ✅ Медиа управление (play/pause/next/prev) - через NirCmd
- ✅ Определение текущего трека - через tasklist (анализ процессов)
- ✅ Скриншоты полного экрана - через NirCmd
- ✅ Получение информации о системе
- ✅ Определение статуса воспроизведения медиа

### 3. Настройка автозапуска после перезагрузки (опционально)

### 4. Запуск через PM2

**Linux (запуск под root):**
```bash
# Переходим в режим root
sudo -i

# Переходим в папку проекта
cd /path/to/tg-desktop-controller

# Делаем скрипты исполняемыми и запускаем
chmod +x scripts/start.sh
./scripts/start.sh
```

**Windows:**
```powershell
# Установить NirSoft утилиты (NirCmd + SoundVolumeCommandLine)
# Требует права администратора!
powershell -ExecutionPolicy Bypass -File scripts/install-deps-windows.ps1

# Установить и запустить PM2
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

**🚀 Для автозапуска после перезагрузки см. раздел "Настройка автозапуска" выше.**

🚀 **Всё! Бот готов к работе.**

**📋 Кроссплатформенные скрипты:**
- `./scripts/start.sh` - запуск/перезапуск бота
- `./scripts/stop.sh` - остановка бота  
- `./scripts/restart.sh` - перезапуск бота
- `./scripts/install-deps-linux.sh` - установка зависимостей Linux (только для Linux)

Автоматические функции:
- Восстановление после режима сна
- Перезапуск при сетевых ошибках  
- Heartbeat проверка соединения
- Понятные логи с эмодзи

## 🛠️ Управление приложением

### Удобные скрипты (работают везде):

```bash
# Запуск/перезапуск
./scripts/start.sh

# Остановка  
./scripts/stop.sh

# Перезапуск
./scripts/restart.sh
```

### Основные команды PM2:

```bash
# Статус приложения
pm2 status

# Просмотр логов
pm2 logs tg-desktop-controller

# Перезапуск
pm2 restart tg-desktop-controller

# Остановка
pm2 stop tg-desktop-controller

# Удаление из PM2
pm2 delete tg-desktop-controller

# Мониторинг
pm2 monit
```

### Логи

Логи сохраняются в директории `logs/`:
- `logs/out.log` - стандартный вывод
- `logs/err.log` - ошибки
- `logs/combined.log` - объединенные логи

## 🤖 Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Приветственное сообщение со списком команд |
| `/help` | Подробная справка по командам |
| `/keyboard` | Принудительное восстановление клавиатуры |
| `/sound_on` | Включить звук (отключить mute) |
| `/sound_off` | Выключить звук (включить mute) |
| `/pause` | Поставить медиа на паузу |
| `/play` | Запустить воспроизведение медиа |
| `/next` | Переключить на следующий трек |
| `/prev` | Переключить на предыдущий трек |
| `/volume_down` | Уменьшить громкость на 5% |
| `/volume_up` | Увеличить громкость на 5% |
| `/suspend` | Перевести компьютер в режим сна (требует подтверждение) |
| `/ping` | Проверка связи и времени отклика |
| `/info` | Подробная информация о системе |

## 🔒 Безопасность

### Авторизация пользователей
Бот поддерживает ограничение доступа по User ID. Установите `AUTHORIZED_USER_ID` в `.env` файле.

### Подтверждение критических операций
Команда `/suspend` требует подтверждения 4-значным кодом, который действует 5 минут.

## 🐛 Устранение неполадок

### Проблемы с аудио
```bash
# Проверьте PulseAudio
pulseaudio --check -v

# Перезапустите PulseAudio
pulseaudio -k
pulseaudio --start
```

### Проблемы с медиа-управлением

**Linux:**
```bash
# Проверьте установку playerctl
playerctl --version

# Список доступных плееров
playerctl -l
```

**Windows:**
```powershell
# Проверьте доступность PowerShell
$PSVersionTable.PSVersion

# Проверьте установку NirCmd
nircmd.exe help
where nircmd.exe

# Проверьте работу медиа-клавиш через NirCmd
nircmd.exe mutesysvolume 2
nircmd.exe mediaplay

# Проверьте управление громкостью через NirCmd
nircmd.exe setsysvolume 32768  # 50% громкости
nircmd.exe changesysvolume 3276  # +5% громкости
```

### Проблемы с NirCmd (Windows)
```powershell
# Если NirCmd не найден:
# 1. Скачайте с https://www.nirsoft.net/utils/nircmd.html
# 2. Поместите nircmd.exe в C:\Windows\System32\ или в папку проекта

# Проверка работы основных команд:
nircmd.exe mutesysvolume 1    # Выключить звук
nircmd.exe mutesysvolume 0    # Включить звук
nircmd.exe savescreenshot "test.png"  # Сделать скриншот

# Если антивирус блокирует NirCmd:
# Добавьте nircmd.exe в исключения антивируса
```

### Проблемы с режимом сна и перезагрузкой
Бот использует несколько методов для suspend/reboot. Если один не работает, он автоматически пробует другие:

```bash
# Метод 1: D-Bus (предпочтительный)
dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 "org.freedesktop.login1.Manager.Suspend" boolean:true

# Метод 2: pm-utils (установите если нет)
sudo apt install pm-utils
pm-suspend

# Метод 3: Настройка без пароля (добавьте пользователя в группу power)
sudo usermod -a -G power $USER

# Для reboot без пароля:
echo "$USER ALL=(ALL) NOPASSWD: /sbin/reboot" | sudo tee /etc/sudoers.d/reboot

# Проверьте поддержку suspend
cat /sys/power/state
```

### Проблемы с PM2
```bash
# Перезапуск PM2 daemon
pm2 kill
pm2 resurrect

# Пересоздание автозапуска
pm2 unstartup
pm2 startup
pm2 save
```

### Проблемы с сетевым соединением

🚀 **Бот автоматически восстанавливается после режима сна!**

**Что делает бот:**
- Перезапускает соединение при сетевых ошибках
- Проверяет связь каждые 60 секунд (heartbeat)
- Автоматически восстанавливается после пробуждения системы
- PM2 перезапускает процесс при критических ошибках

**⚡ Простое решение - никаких сложных настроек!**

## 📊 Мониторинг работы

### PM2 мониторинг

```bash
# Статус бота
pm2 status

# Мониторинг в реальном времени
pm2 monit

# Подробная информация
pm2 show tg-desktop-controller

# Логи с эмодзи-индикаторами  
pm2 logs tg-desktop-controller --lines 50
```

### 📱 Понимание логов

Бот использует простые эмодзи для понимания состояния:

- `🚀` - Запуск бота
- `💚` - Heartbeat (связь работает)
- `🔄` - Перезапуск соединения
- `⚠️` - Предупреждения
- `❌` - Ошибки
- `💀` - Критические ошибки

### 🔧 Полезные команды

```bash
# Отслеживание heartbeat
pm2 logs | grep "Heartbeat"

# Отслеживание перезапусков
pm2 logs | grep "перезапуск"

# Отслеживание ошибок
pm2 logs | grep "❌\|💀"

## 📄 Системные требования

- **ОС**: Linux с systemd или Windows 10/11
- **Node.js**: версия 18.0.0 или выше
- **RAM**: минимум 100MB для работы бота
- **Права**: 
  - **Linux**: пользователь должен иметь доступ к PulseAudio и playerctl
  - **Windows**: PowerShell должен быть доступен для выполнения команд

## 🔄 Обновление

```bash
cd your-project-directory
git pull  # если используется git
npm update
pm2 restart tg-desktop-controller
```

## 📝 Логирование

Все действия логируются с временными метками. Уровни логирования:
- ✅ Успешные операции
- ❌ Ошибки
- ⚠️ Предупреждения
- ℹ️ Информационные сообщения

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `pm2 logs tg-desktop-controller`
2. Убедитесь, что все системные зависимости установлены
3. Проверьте правильность настройки `.env` файла
4. Убедитесь, что бот имеет необходимые системные права

## 📜 Лицензия

MIT License - используйте свободно для личных и коммерческих проектов. 