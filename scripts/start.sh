#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверяем, запущен ли скрипт из правильной директории
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

print_status "Переходим в директорию проекта: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
    print_error "Не удалось перейти в директорию проекта: $PROJECT_DIR"
    exit 1
}

# Проверяем наличие необходимых файлов
print_status "Проверяем наличие необходимых файлов..."

if [ ! -f "package.json" ]; then
    print_error "Файл package.json не найден!"
    exit 1
fi

if [ ! -f "src/index.mjs" ]; then
    print_error "Файл src/index.mjs не найден!"
    exit 1
fi

if [ ! -f ".env" ]; then
    print_warning "Файл .env не найден! Создайте его на основе .env.example"
fi

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js не установлен! Установите Node.js версии 18 или выше."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)

if [ $MAJOR_VERSION -lt 18 ]; then
    print_error "Требуется Node.js версии 18 или выше. Текущая версия: $NODE_VERSION"
    exit 1
fi

print_success "Node.js версия $NODE_VERSION найдена"

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    print_error "npm не установлен!"
    exit 1
fi

# Проверяем наличие PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 не установлен. Устанавливаем PM2..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        print_success "PM2 успешно установлен"
    else
        print_error "Ошибка установки PM2"
        exit 1
    fi
else
    print_success "PM2 найден"
fi

# Проверяем наличие зависимостей
if [ ! -d "node_modules" ]; then
    print_status "Устанавливаем зависимости..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Зависимости успешно установлены"
    else
        print_error "Ошибка установки зависимостей"
        exit 1
    fi
else
    print_status "Обновляем зависимости..."
    npm update
fi

# Создаем директорию для логов
mkdir -p logs

# Проверяем, запущено ли приложение
if pm2 describe tg-desktop-controller > /dev/null 2>&1; then
    print_status "Приложение уже запущено. Перезапускаем..."
    pm2 restart tg-desktop-controller
else
    print_status "Запускаем приложение..."
    pm2 start ecosystem.config.cjs
fi

# Сохраняем конфигурацию PM2 для автозапуска
print_status "Настраиваем автозапуск..."
pm2 save

# Устанавливаем автозапуск PM2 при загрузке системы
pm2 startup | grep -v "PM2" | bash

if [ $? -eq 0 ]; then
    print_success "Автозапуск успешно настроен"
else
    print_warning "Возможны проблемы с настройкой автозапуска. Попробуйте выполнить команду вручную:"
    print_warning "pm2 startup"
fi

# Показываем статус
print_status "Проверяем статус приложения..."
pm2 status

print_success "=== Настройка завершена! ==="
print_status "Приложение запущено и настроен автозапуск"
print_status "Полезные команды:"
echo "  pm2 status                    - статус приложений"
echo "  pm2 logs tg-desktop-controller - просмотр логов"
echo "  pm2 restart tg-desktop-controller - перезапуск"
echo "  pm2 stop tg-desktop-controller - остановка"
echo "  pm2 delete tg-desktop-controller - удаление из PM2"

print_warning "Не забудьте настроить .env файл с токеном бота!" 