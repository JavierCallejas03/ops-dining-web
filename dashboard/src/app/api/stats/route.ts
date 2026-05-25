import { NextResponse } from 'next/server';
import { getRealStats } from '@/lib/n8n';

export async function GET() {
  const stats = await getRealStats();
  return NextResponse.json(stats);
}
