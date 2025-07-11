#!/bin/bash

# Кроссплатформенный скрипт остановки Telegram Desktop Controller
# Работает на Linux, macOS, Windows (Git Bash)

set -e

echo "🛑 Остановка Telegram Desktop Controller..."

# Проверяем наличие PM2
if ! command -v pm2 >/dev/null 2>&1; then
    echo "❌ PM2 не найден!"
    exit 1
fi

# Проверяем, запущено ли приложение
if pm2 describe tg-desktop-controller >/dev/null 2>&1; then
    echo "⏹️ Останавливаем процесс..."
    pm2 stop tg-desktop-controller
    
    echo "🗑️ Удаляем из PM2..."
    pm2 delete tg-desktop-controller
    
    echo "✅ Telegram Desktop Controller остановлен!"
else
    echo "⚠️ Приложение не запущено"
fi

echo ""
echo "📊 Статус PM2:"
pm2 status 