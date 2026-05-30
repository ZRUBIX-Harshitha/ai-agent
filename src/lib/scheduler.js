import { Redis } from '@upstash/redis';
import { sendWhatsAppMessage } from './whatsapp';

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

export async function getTasks() {
  if (!redis) {
    console.warn('Redis is not configured. Returning empty tasks array.');
    return [];
  }
  try {
    const tasks = await redis.get('ai-tasks');
    return tasks || [];
  } catch (e) {
    console.error('Error fetching tasks from Redis:', e);
    return [];
  }
}

export async function saveTasks(tasks) {
  if (!redis) {
    console.warn('Redis is not configured. Skipping save.');
    return;
  }
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
