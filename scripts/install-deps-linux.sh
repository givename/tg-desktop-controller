#!/bin/bash

# Скрипт автоматической установки зависимостей для Linux
# Telegram Desktop Controller Bot
# Запуск: sudo ./scripts/install-deps-linux.sh

set -e  # Остановить скрипт при ошибке

echo "🐧 Установка зависимостей Telegram Desktop Controller для Linux..."
echo "════════════════════════════════════════════════════════════════"

# Проверяем что запущено под root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен запускаться под root!"
   echo "   Используйте: sudo ./scripts/install-deps-linux.sh"
   exit 1
fi

# Функция обнаружения дистрибутива
detect_distro() {
    if command -v apt-get >/dev/null 2>&1; then
        echo "ubuntu"
    elif command -v yum >/dev/null 2>&1; then
        echo "centos"
    elif command -v pacman >/dev/null 2>&1; then
        echo "arch"
    elif command -v zypper >/dev/null 2>&1; then
        echo "opensuse"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
echo "🔍 Обнаружен дистрибутив: $DISTRO"

# Обновляем списки пакетов
echo "📦 Обновление списков пакетов..."
case $DISTRO in
    "ubuntu")
        apt-get update
        ;;
    "centos")
        yum update -y
        ;;
    "arch")
        pacman -Sy
        ;;
    "opensuse")
        zypper refresh
        ;;
    *)
        echo "⚠️ Неизвестный дистрибутив, пропускаем обновление пакетов"
        ;;
esac

# Устанавливаем основные зависимости
echo "🔧 Установка основных зависимостей..."
case $DISTRO in
    "ubuntu")
        apt-get install -y \
            curl \
            wget \
            playerctl \
            pulseaudio-utils \
            systemd \
            dbus \
            pm-utils \
            build-essential
        ;;
    "centos")
        yum install -y \
            curl \
            wget \
            playerctl \
            pulseaudio-utils \
            systemd \
            dbus \
            pm-utils \
            gcc \
            gcc-c++ \
            make
        ;;
    "arch")
        pacman -S --noconfirm \
            curl \
            wget \
            playerctl \
            pulseaudio \
            systemd \
            dbus \
            pm-utils \
            base-devel
        ;;
    "opensuse")
        zypper install -y \
            curl \
            wget \
            playerctl \
            pulseaudio-utils \
            systemd \
            dbus-1 \
            pm-utils \
            gcc \
            gcc-c++ \
            make
        ;;
    *)
        echo "❌ Неизвестный дистрибутив: $DISTRO"
        echo "   Установите вручную: curl, wget, playerctl, pulseaudio-utils, systemd, dbus, pm-utils"
        exit 1
        ;;
esac

# Проверяем установку Node.js
echo "🔍 Проверка Node.js..."
if ! command -v node >/dev/null 2>&1; then
    echo "📥 Node.js не найден, устанавливаем..."
    
    # Устанавливаем Node.js через NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    case $DISTRO in
        "ubuntu")
            apt-get install -y nodejs
            ;;
        "centos")
            yum install -y nodejs npm
            ;;
        "arch")
            pacman -S --noconfirm nodejs npm
            ;;
        "opensuse")
            zypper install -y nodejs18 npm18
            ;;
    esac
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js уже установлен: $NODE_VERSION"
fi

# Проверяем установку npm
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm не найден!"
    echo "   Установите npm вручную"
    exit 1
fi

# Устанавливаем PM2 глобально
echo "🚀 Установка PM2..."
npm install -g pm2

# Проверяем работоспособность основных команд
echo "🧪 Проверка установленных зависимостей..."

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✅ $1 - установлен"
    else
        echo "❌ $1 - НЕ НАЙДЕН!"
        MISSING_DEPS=true
    fi
}

MISSING_DEPS=false
check_command "node"
check_command "npm"
check_command "pm2"
check_command "playerctl"
check_command "pactl"
check_command "systemctl"

# Проверяем специфичные для аудио команды
echo "🔊 Проверка аудио команд..."
if playerctl --list-all >/dev/null 2>&1; then
    echo "✅ playerctl - работает"
else
    echo "⚠️ playerctl - нет активных плееров (это нормально если музыка не играет)"
fi

if pactl info >/dev/null 2>&1; then
    echo "✅ pulseaudio - работает"
else
    echo "❌ pulseaudio - НЕ РАБОТАЕТ!"
    MISSING_DEPS=true
fi

# Проверяем системные команды
echo "💤 Проверка системных команд..."
if systemctl status >/dev/null 2>&1; then
    echo "✅ systemd - работает"
else
    echo "❌ systemd - НЕ РАБОТАЕТ!"
    MISSING_DEPS=true
fi

# Настройка без пароля для suspend/reboot (опционально)
echo "🔐 Настройка команд без пароля..."
SUDOERS_FILE="/etc/sudoers.d/tg-desktop-controller"

if [[ ! -f "$SUDOERS_FILE" ]]; then
    echo "Создание правил sudo для suspend/reboot без пароля..."
    cat > "$SUDOERS_FILE" << EOF
# Разрешить всем пользователям suspend/reboot без пароля для Telegram Desktop Controller
%users ALL=(ALL) NOPASSWD: /usr/bin/systemctl suspend
%users ALL=(ALL) NOPASSWD: /usr/bin/systemctl reboot
%users ALL=(ALL) NOPASSWD: /usr/bin/systemctl poweroff
%users ALL=(ALL) NOPASSWD: /sbin/reboot
%users ALL=(ALL) NOPASSWD: /sbin/poweroff
%users ALL=(ALL) NOPASSWD: /usr/sbin/pm-suspend
EOF
    echo "✅ Настроены права sudo для системных команд"
else
    echo "✅ Права sudo уже настроены"
fi

# Результат установки
echo ""
echo "════════════════════════════════════════════════════════════════"
if [[ "$MISSING_DEPS" = true ]]; then
    echo "⚠️ УСТАНОВКА ЗАВЕРШЕНА С ПРЕДУПРЕЖДЕНИЯМИ"
    echo "   Некоторые зависимости могут работать некорректно"
    echo "   Проверьте вывод выше"
else
    echo "🎉 УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!"
    echo "   Все зависимости установлены и работают"
fi

echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте .env файл с токеном бота"
echo "2. Запустите бота: sudo ./scripts/start.sh"
echo "3. Проверьте логи: pm2 logs tg-desktop-controller"
echo ""
echo "🔧 Полезные команды:"
echo "   pm2 status                    - статус процессов"
echo "   pm2 logs tg-desktop-controller - просмотр логов"
echo "   pm2 restart tg-desktop-controller - перезапуск"
echo "   playerctl -l                  - список медиа плееров"
echo "   pactl info                    - информация о PulseAudio" 