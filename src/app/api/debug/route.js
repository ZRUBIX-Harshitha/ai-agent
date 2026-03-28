import { NextResponse } from 'next/server';
import { getTelegramStatus } from '@/lib/telegram';

export async function GET() {
  try {
    const status = getTelegramStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
