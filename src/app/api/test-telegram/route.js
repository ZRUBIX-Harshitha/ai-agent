import { NextResponse } from 'next/server';
import { sendTelegramReminder } from '@/lib/telegram';

export async function POST(req) {
  try {
    const { chatId } = await req.json();
    if (!chatId) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });

    await sendTelegramReminder(chatId, 'This is a test message from your AI Task Reminder! It works! 🚀');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test Telegram Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
