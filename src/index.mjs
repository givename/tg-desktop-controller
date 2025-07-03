import { validateEnv } from './env.config.mjs';
import { bot } from './tg-bot.instance.mjs';
import { setupBotLogic } from './tg-bot.logic.mjs';
import { CONSOLE_MESSAGES } from './text.provider.mjs';

// Валидируем переменные окружения перед запуском
validateEnv();

// Выводим информацию о запуске
console.log(CONSOLE_MESSAGES.BOT_STARTED);
console.log(CONSOLE_MESSAGES.AVAILABLE_COMMANDS);
console.log(CONSOLE_MESSAGES.KEYBOARD_HELP);

setupBotLogic(bot);
