import { NextResponse } from 'next/server';

// This is a mock storage for notifications. 
// In a real app, you would use a database like Redis or PostgreSQL.
let notifications: any[] = [];

export async function GET() {
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  const newNotification = {
    id: Date.now().toString(),
    title: data.title || 'Nueva Alerta',
    message: data.message || 'Sin descripción',
    time: 'Ahora',
    type: data.type || 'system',
    createdAt: new Date().toISOString(),
  };

  notifications = [newNotification, ...notifications].slice(0, 20);

  return NextResponse.json({ success: true, notification: newNotification });
}
