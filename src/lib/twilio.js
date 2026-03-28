import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || (fromNumber ? `whatsapp:${fromNumber}` : undefined);

// Validation
const isConfigured = !!(accountSid && authToken && fromNumber);
if (!isConfigured) {
  console.error('[Twilio] Missing credentials. Check .env file.');
}

const client = isConfigured ? twilio(accountSid, authToken) : null;

/**
 * Makes an AI voice call.
 */
export async function makeVoiceCall(to, message, voice = 'alice') {
  if (!client || !fromNumber) {
    throw new Error('Twilio not configured');
  }
  return client.calls.create({
    twiml: `<Response><Say voice="${voice}">${message}</Say></Response>`,
    to,
    from: fromNumber,
    statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/status-callback`,
    statusCallbackEvent: ['completed', 'no-answer', 'busy', 'failed'],
  }).then(call => call.sid);
}

/**
 * Sends an SMS.
 */
export async function sendSMS(to, body) {
  if (!client || !fromNumber) throw new Error('Twilio not configured');
  return client.messages.create({ body, to, from: fromNumber }).then(m => m.sid);
}

/**
 * Sends a WhatsApp message.
 */
export async function sendWhatsApp(to, body) {
  if (!client || !whatsappFrom) throw new Error('Twilio not configured for WhatsApp');
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  return client.messages.create({ body, to: formattedTo, from: whatsappFrom }).then(m => m.sid);
}

/**
 * Debug function to check config.
 */
export function getTwilioConfigStatus() {
  return {
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasFromNumber: !!fromNumber,
    isReady: isConfigured,
    fromNumber: fromNumber || 'not set'
  };
}
