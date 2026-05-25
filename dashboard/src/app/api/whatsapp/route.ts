import { NextResponse } from 'next/server';
import { getWhatsAppMessages } from '@/lib/n8n';

export async function GET() {
  try {
    const messages = await getWhatsAppMessages();
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json([]);
  }
}
