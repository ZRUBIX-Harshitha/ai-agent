/**
 * Sends a WhatsApp message using the Meta Cloud API.
 * @param {string} phone - User's phone number with country code (e.g., 919876543210)
 * @param {string} text - Message to send
 */
export async function sendWhatsAppMessage(phone, text) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WhatsApp Business credentials missing in .env');
  }

  // Sanitize phone: remove +, spaces, etc.
  const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
  
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  try {
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
          body: `🤖 *AI REMINDER*\n\n*Task:* ${text}\n*Time:* ${new Date().toLocaleString()}\n\nPlease finish this task!`
        }
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return true;
  } catch (error) {
    console.error('WhatsApp API Error:', error.message);
    throw error;
  }
}
