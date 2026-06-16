import config from '../config';

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!config.telegramBotToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch {
    // non-blocking — XP was already awarded
  }
}
