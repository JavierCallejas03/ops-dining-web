import { NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/n8n';

export async function GET() {
  try {
    const workflows = await getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}
