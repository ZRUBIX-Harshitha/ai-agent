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

    const now = new Date();
    let updated = false;

    // Hardcoded credentials
    const WHATSAPP_TOKEN = "EAAOTPaQVbKABRhL5NeL1AcAUnHAOgAwMZCqvqVh4oZCDfPA9PkJ5ivZCpmMSz7oA9nkTUGseKf1OXpo7GBONCoDMFfdP44ZBjX3nh9Nnj0eEfYpUpAhW2v0xFSIL4DrUNY1pBadndwayGPYoeLsMtDIGV2KfVEKQN9hKTS5Psc7EBKLZAHmjTQXrpN6pZCvgCNDBE7Gew3lACiJfCtVx08Du3mKVRuKDGMt90kH5P5HFLaNdHIUe2SqvCQps9oD1Kfh89MVVN2yX0hejTN6XrZCJqWI";
    const PHONE_NUMBER_ID = "1083960074809421";

    for (const task of tasks) {
      const taskTime = new Date(task.scheduledTime);

      if (taskTime <= now && task.status === 'pending') {
        try {
          if (task.voice === 'virtual') {
            task.status = 'completed'; // Handled by frontend
            updated = true;
          } else if (task.voice === 'whatsapp') {
            // WhatsApp API Logic
            const cleanPhone = task.phone.replace(/\+/g, '').replace(/\s/g, '');
            const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanPhone,
                type: "text",
                text: {
                  preview_url: false,
                  body: `🤖 *AI REMINDER*\n\n*Task:* ${task.message}\n*Time:* ${new Date().toLocaleString()}\n\nPlease finish this task!`
                }
              })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error.message);

            task.status = 'completed';
            updated = true;
          }
        } catch (error) {
          console.error(`Task failed for ${task.id}:`, error.message);
          task.status = 'failed';
          updated = true;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    }

    return NextResponse.json({ success: true, message: "Cron executed successfully", processed: updated });
  } catch (error) {
    console.error('Cron API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
