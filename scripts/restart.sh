#!/bin/bash

# Кроссплатформенный скрипт перезапуска Telegram Desktop Controller
# Работает на Linux, macOS, Windows (Git Bash)

set -e

echo "🔄 Перезапуск Telegram Desktop Controller..."

# Переходим в директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Проверяем наличие PM2
if ! command -v pm2 >/dev/null 2>&1; then
    echo "❌ PM2 не найден! Установите PM2:"
    echo "   npm install -g pm2"
    exit 1
fi

# Проверяем, запущено ли приложение
if pm2 describe tg-desktop-controller >/dev/null 2>&1; then
    echo "🔄 Перезапускаем процесс..."
    pm2 restart tg-desktop-controller
    echo "✅ Telegram Desktop Controller перезапущен!"
else
    echo "⚠️ Приложение не запущено, запускаем..."
    
    # Проверяем наличие конфигурации
    if [ ! -f "ecosystem.config.cjs" ]; then
        echo "❌ Файл ecosystem.config.cjs не найден!"
        exit 1
    fi
    
    pm2 start ecosystem.config.cjs
    echo "✅ Telegram Desktop Controller запущен!"
fi

# Сохраняем конфигурацию
pm2 save

echo ""
echo "📊 Статус:"
pm2 status

echo ""
echo "🔧 Полезные команды:"
echo "   pm2 logs tg-desktop-controller  - просмотр логов"
echo "   pm2 stop tg-desktop-controller  - остановка" 