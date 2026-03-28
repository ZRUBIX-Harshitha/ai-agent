/**
 * Sends a WhatsApp message using the free CallMeBot API.
 * @param {string} phone - User's phone number with country code (e.g., 919876543210)
 * @param {string} text - Message to send
 * @param {string} apiKey - User's personal CallMeBot API Key
 */
export async function sendWhatsAppFree(phone, text, apiKey) {
  if (!phone || !text || !apiKey) {
    throw new Error('Missing WhatsApp parameters (phone, text, or apiKey)');
  }

  // Sanitize phone: remove +, spaces, etc.
  const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
  const encodedText = encodeURIComponent(`🔔 AI REMINDER:\n\n${text}`);
  
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const result = await response.text();
    
    if (result.toLowerCase().includes('error')) {
      throw new Error(result);
    }
    
    return true;
  } catch (error) {
    console.error('CallMeBot Error:', error.message);
    throw error;
  }
}
