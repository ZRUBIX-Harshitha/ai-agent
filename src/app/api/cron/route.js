import { NextResponse } from 'next/server';
import { getTasks, saveTasks } from '@/lib/scheduler';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// This endpoint is called by Vercel Cron every minute
export async function GET(request) {
  try {
    const tasks = await getTasks();
    const now = new Date();
    let updated = false;

    console.log(`[Cron] Checking tasks at ${now.toISOString()}...`);

    for (const task of tasks) {
      const taskTime = new Date(task.scheduledTime);

      if (taskTime <= now && task.status === 'pending') {
        console.log(`[Cron] Executing task: ${task.message} for ${task.phone || 'Browser'}`);

        try {
          if (task.voice === 'virtual') {
            task.status = 'completed'; // Handled by frontend polling
          } else if (task.voice === 'whatsapp') {
            await sendWhatsAppMessage(task.phone, task.message);
            task.status = 'completed';
          }
          updated = true;
        } catch (error) {
          console.error(`[Cron] Task failed for ${task.id}:`, error.message);
          task.status = 'failed';
          updated = true;
        }
      }
    }

    if (updated) {
      await saveTasks(tasks);
    }

    return NextResponse.json({ success: true, message: 'Cron job executed' });
  } catch (error) {
    console.error('[Cron] Error executing cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
