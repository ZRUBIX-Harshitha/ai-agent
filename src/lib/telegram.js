import TelegramBot from 'node-telegram-bot-api';
import * as googleTTS from 'google-tts-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = token ? new TelegramBot(token, { polling: false }) : null;

/**
 * Sends a text and voice reminder via Telegram.
 * @param {string} chatId - User's Telegram Chat ID.
 * @param {string} message - The reminder message.
 */
export async function sendTelegramReminder(chatId, message) {
  if (!bot) throw new Error('Telegram Bot not configured');

  try {
    // 1. Send Text Message
    await bot.sendMessage(chatId, `🔔 AI REMINDER:\n\n${message}`);

    // 2. Generate AI Voice Note (Free via Google TTS)
    const url = googleTTS.getAudioUrl(message, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });

    // 3. Send Voice Note
    await bot.sendVoice(chatId, url);

    return true;
  } catch (error) {
    console.error('Telegram Bot Error:', error.message);
    throw error;
  }
}

/**
 * Check if Telegram is configured.
 */
export function getTelegramStatus() {
  return {
    isReady: !!bot,
    botName: 'AI Task Reminder Bot'
  };
}
