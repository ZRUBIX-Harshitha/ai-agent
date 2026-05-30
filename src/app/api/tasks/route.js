import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getTasksFile() {
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL || process.env.NODE_ENV === 'production';
  return isServerless ? path.join('/tmp', 'tasks.json') : path.join(process.cwd(), 'tasks.json');
}

export async function GET() {
  try {
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
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

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

    tasks = tasks.filter(t => t.id !== id);
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
