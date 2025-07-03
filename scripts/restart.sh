#!/bin/bash

# Останавливаем текущий процесс
pm2 stop tg-desktop-controller

# Очищаем логи
rm -rf logs/*

# Запускаем с обновленной конфигурацией
pm2 start ecosystem.config.cjs

# Показываем статус и последние логи
echo "Status:"
pm2 status tg-desktop-controller
echo -e "\nLast logs:"
pm2 logs tg-desktop-controller --lines 5 