export const metadata = {
  title: 'AI Multi-Reminder | Automated Text & Voice Alerts',
  description: 'Schedule automated WhatsApp text reminders and offline voice alerts effortlessly. AI Multi-Reminder is your intelligent assistant for managing tasks.',
  alternates: {
    canonical: 'https://ai-agent-work-assistance.vercel.app/ai-task',
  },
  openGraph: {
    title: 'AI Multi-Reminder | Automated Text & Voice Alerts',
    description: 'Schedule automated WhatsApp text reminders and offline voice alerts effortlessly. AI Multi-Reminder is your intelligent assistant for managing tasks.',
    url: 'https://ai-agent-work-assistance.vercel.app/ai-task',
    siteName: 'AI Work Assistance',
    images: [
      {
        url: 'https://ai-agent-work-assistance.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Multi-Reminder Dashboard Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Multi-Reminder | Automated Text & Voice Alerts',
    description: 'Schedule automated WhatsApp text reminders and offline voice alerts effortlessly.',
    images: ['https://ai-agent-work-assistance.vercel.app/og-image.jpg'],
  },
};

export default function AITaskLayout({ children }) {
  return <>{children}</>;
}
