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
    const WHATSAPP_TOKEN = "EAAOTPaQVbKABRvdm9ZAauS8s9T8UNqVOoRpsHRF2cRlnoRbcMVwYKxwdoZAP1KbsuCZC1QzZC3HiGBz3H8uy6guapz3sZC0iynZAxVOXi8rhznxoauwbHbDXL17nUCeBd1dKRdfZBt7xuKkM5pIjmSAqnAcmxgLbGe4THvwokZCsZBngKbw4OM4xB3Q6vvoMZCeFxAH8RKXSQkMKZCNefcbIj4pyhEFPnK0rcgZAVyj7PW70SMitZB8PeQI0MZB2wfRncoYtI1OIQafa4Co17glAN2NsRKzeRMrwZDZD";
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
