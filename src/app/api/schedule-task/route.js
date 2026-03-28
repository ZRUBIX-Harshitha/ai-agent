import { NextResponse } from 'next/server';
import { scheduleTask } from '@/lib/scheduler';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const { message, chatId, phone, whatsappApiKey, scheduledTime, voice } = await req.json();

    if (!message || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const task = {
      id: uuidv4(),
      message,
      chatId: (voice === 'telegram' || voice === 'both') ? chatId : null,
      phone: (voice === 'whatsapp_free' || voice === 'both') ? phone : (voice === 'virtual' ? 'BROWSER' : null),
      whatsappApiKey: (voice === 'whatsapp_free' || voice === 'both') ? whatsappApiKey : null,
      scheduledTime,
      voice: voice || 'telegram',
    };

    scheduleTask(task);

    return NextResponse.json({ success: true, taskId: task.id });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
