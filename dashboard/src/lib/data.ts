export interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastExecution: string;
  totalExecutions: number;
  successRate: number;
  type: 'admin' | 'web' | 'order' | 'payment' | 'onboarding';
}

export const workflows: Workflow[] = [
  {
    id: '1',
    name: '[ADMIN] Gestion de Clientes WhatsApp',
    status: 'active',
    lastExecution: 'Hace 5 minutos',
    totalExecutions: 1240,
    successRate: 99.2,
    type: 'admin'
  },
  {
    id: '2',
    name: 'OPS Dining — Formulario Web',
    status: 'active',
    lastExecution: 'Hace 12 minutos',
    totalExecutions: 856,
    successRate: 100,
    type: 'web'
  },
  {
    id: '3',
    name: 'Ops Dining - Registro y Confirmacion de Pedidos',
    status: 'active',
    lastExecution: 'Hace 2 horas',
    totalExecutions: 324,
    successRate: 98.5,
    type: 'order'
  },
  {
    id: '4',
    name: 'Ops Dining — Procesador de Pagos (Stripe)',
    status: 'active',
    lastExecution: 'Hace 1 día',
    totalExecutions: 156,
    successRate: 97.8,
    type: 'payment'
  },
  {
    id: '5',
    name: 'Ops Dining - Onboarding Clientes',
    status: 'inactive',
    lastExecution: 'Hace 3 días',
    totalExecutions: 45,
    successRate: 100,
    type: 'onboarding'
  }
];

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'whatsapp' | 'google-sheets' | 'stripe' | 'system';
}

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Nuevo Lead WhatsApp',
    message: 'Se ha iniciado una conversación con +34 600 000 000',
    time: 'Ahora',
    type: 'whatsapp'
  },
  {
    id: 'n2',
    title: 'Fila añadida a Sheets',
    message: 'Registro de pedido #4522 completado en el Excel.',
    time: 'Hace 10 min',
    type: 'google-sheets'
  },
  {
    id: 'n3',
    title: 'Pago Recibido',
    message: 'Pago de 45.00€ procesado con éxito vía Stripe.',
    time: 'Hace 1 hora',
    type: 'stripe'
  }
];
