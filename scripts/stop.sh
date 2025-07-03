#!/bin/bash

# Скрипт для полной остановки Telegram Desktop Controller Bot,
# запущенного через PM2, с наглядным выводом статуса.
# Аналогичен стилю start.sh / restart.sh.

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status()   { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success()  { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning()  { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()    { echo -e "${RED}[ERROR]${NC} $1"; }

APP_NAME="tg-desktop-controller"

# Проверяем наличие PM2
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 не установлен!"
    exit 1
fi

# Проверяем, запущено ли приложение
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    print_status "Останавливаем процесс $APP_NAME..."
    pm2 stop "$APP_NAME"
    pm2 delete "$APP_NAME"
    print_success "Процесс $APP_NAME остановлен и удалён из PM2"
else
    print_warning "Процесс $APP_NAME не запущен или уже удалён из PM2"
fi

# Очищаем логи (опционально)
print_status "Очищаем логи..."
rm -rf logs/* 2>/dev/null || true

# Сохраняем текущее состояние PM2 (обновляем список автозапуска)
print_status "Сохраняем конфигурацию PM2..."
pm2 save

# Показываем итоговый статус
print_status "Текущий статус PM2:"
pm2 status "$APP_NAME" 