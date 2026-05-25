import { NextResponse } from 'next/server';
import { getRecentExecutions } from '@/lib/n8n';

export async function GET() {
  const executions = await getRecentExecutions(15);
  return NextResponse.json(executions);
}
