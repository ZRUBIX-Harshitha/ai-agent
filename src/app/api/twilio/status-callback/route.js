import { NextResponse } from 'next/server';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';
import fs from 'fs';
import path from 'path';

const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

function getTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');

    console.log(`Call Status Update: SID=${callSid}, Status=${callStatus}`);

    const tasks = getTasks();
    const task = tasks.find(t => t.callSid === callSid);

    if (task && task.status === 'calling') {
      // If the call was not answered or failed
      if (['no-answer', 'busy', 'failed'].includes(callStatus)) {
        console.log(`Call status ${callStatus} for task ${task.id}. Triggering fallback...`);
        
        await sendSMS(task.phone, `Reminder: ${task.message}. We tried calling you but missed it.`);
        await sendWhatsApp(task.phone, `Reminder: ${task.message}. We tried calling you but missed it.`);
        
        task.status = 'failed_fallback_sent';
      } else if (callStatus === 'completed') {
        task.status = 'completed';
      }
      
      saveTasks(tasks);
    }

    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Status Callback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
