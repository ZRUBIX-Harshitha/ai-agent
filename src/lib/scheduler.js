import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { sendWhatsAppMessage } from './whatsapp';

const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
}

export function getTasks() {
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveTasks(tasks) {
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
      console.log(`[Scheduler] Executing task: ${task.message} for ${task.phone || 'Browser'}`);

      try {
        if (task.voice === 'virtual') {
          task.status = 'completed'; // Handled by frontend
        } else if (task.voice === 'whatsapp') {
          await sendWhatsAppMessage(task.phone, task.message);
          task.status = 'completed';
        }
        updated = true;
      } catch (error) {
        console.error(`[Scheduler] Task failed for ${task.id}:`, error.message);
        fs.appendFileSync(path.join(process.cwd(), 'error.log'), `[Scheduler] Task failed for ${task.id}: ${error.message}\n`);
        task.status = 'failed';
        updated = true;
      }
    }
  }

  if (updated) saveTasks(tasks);
});
