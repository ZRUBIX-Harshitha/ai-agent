import { Redis } from '@upstash/redis';
import { sendWhatsAppMessage } from './whatsapp';

const redis = Redis.fromEnv();

export async function getTasks() {
  try {
    const tasks = await redis.get('ai-tasks');
    return tasks || [];
  } catch (e) {
    console.error('Error fetching tasks from Redis:', e);
    return [];
  }
}

export async function saveTasks(tasks) {
  try {
    await redis.set('ai-tasks', tasks);
  } catch (e) {
    console.error('Error saving tasks to Redis:', e);
  }
}

export async function scheduleTask(task) {
  const tasks = await getTasks();
  tasks.push({ ...task, status: 'pending' });
  await saveTasks(tasks);
}

export async function unScheduleTask(taskId) {
  const tasks = await getTasks();
  await saveTasks(tasks.filter(t => t.id !== taskId));
}

// The Cron logic is now moved to the new /api/cron endpoint!
