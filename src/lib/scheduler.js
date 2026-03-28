import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { sendTelegramReminder } from './telegram';
import { sendWhatsAppFree } from './whatsapp';

const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
}

function getTasks() {
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export function scheduleTask(task) {
  const tasks = getTasks();
  tasks.push({ ...task, status: 'pending' });
  saveTasks(tasks);
}

export function unScheduleTask(taskId) {
  const tasks = getTasks();
  saveTasks(tasks.filter(t => t.id !== taskId));
}

// Every minute check
cron.schedule('* * * * *', async () => {
  const tasks = getTasks();
  const now = new Date();
  let updated = false;

  console.log(`[Scheduler] Checking tasks at ${now.toISOString()}...`);

  for (const task of tasks) {
    const taskTime = new Date(task.scheduledTime);

    if (taskTime <= now && task.status === 'pending') {
      console.log(`[Scheduler] Executing Telegram task: ${task.message} for ${task.chatId}`);

      try {
        if (task.voice === 'virtual') {
          task.status = 'completed'; // Handled by frontend
        } else if (task.voice === 'telegram') {
          await sendTelegramReminder(task.chatId, task.message);
          task.status = 'completed';
        } else if (task.voice === 'whatsapp_free') {
          await sendWhatsAppFree(task.phone, task.message, task.whatsappApiKey);
          task.status = 'completed';
        } else if (task.voice === 'both') {
          // Send to BOTH Telegram and WhatsApp
          await Promise.all([
            sendTelegramReminder(task.chatId, task.message),
            sendWhatsAppFree(task.phone, task.message, task.whatsappApiKey)
          ]);
          task.status = 'completed';
        }
        updated = true;
      } catch (error) {
        console.error(`[Scheduler] Telegram failed for ${task.id}:`, error.message);
        task.status = 'failed';
        updated = true;
      }
    }
  }

  if (updated) saveTasks(tasks);
});
