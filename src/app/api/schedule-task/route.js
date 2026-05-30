import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

function getTasksFile() {
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL || process.env.NODE_ENV === 'production';
  return isServerless ? path.join('/tmp', 'tasks.json') : path.join(process.cwd(), 'tasks.json');
}

export async function POST(req) {
  try {
    const { message, phone, scheduledTime, voice } = await req.json();

    if (!message || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const task = {
      id: uuidv4(),
      message,
      phone: voice === 'whatsapp' ? phone : (voice === 'virtual' ? 'BROWSER' : null),
      scheduledTime,
      voice: voice || 'whatsapp',
      status: 'pending'
    };

    const TASKS_FILE = getTasksFile();
    let tasks = [];
    
    if (fs.existsSync(TASKS_FILE)) {
      try {
        const data = fs.readFileSync(TASKS_FILE, 'utf-8');
        tasks = JSON.parse(data);
      } catch (e) {
        console.error("Error reading tasks file:", e);
      }
    }

    tasks.push(task);
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));

    return NextResponse.json({ success: true, taskId: task.id });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
