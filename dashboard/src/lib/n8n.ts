const N8N_API_URL = 'https://n8n.opsdining.com/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function n8nFetch(path: string) {
  const res = await fetch(`${N8N_API_URL}${path}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY || '' },
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error(`n8n ${res.status}: ${path}`);
  return res.json();
}

export async function getWorkflows() {
  const data = await n8nFetch('/workflows?limit=100');
  return (data.data || []).filter((wf: any) =>
    wf.name.toLowerCase().includes('ops dining') ||
    wf.name.toLowerCase().includes('[admin]')
  );
}

export async function getExecutions(limit = 50) {
  const data = await n8nFetch(`/executions?limit=${limit}`);
  return data.data || [];
}

export async function getRealStats() {
  try {
    const executions = await getExecutions(100);
    const total = executions.length;
    const success = executions.filter((e: any) => e.status === 'success').length;
    const errors = executions.filter((e: any) => e.status === 'error').length;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0';

    // Latencia real: diferencia startedAt vs stoppedAt
    const latencies = executions
      .filter((e: any) => e.startedAt && e.stoppedAt)
      .map((e: any) => new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime());
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length / 1000)
      : 0;

    return {
      total,
      success,
      errors,
      rate: `${rate}%`,
      latency: `${avgLatency}s`,
      lastRun: executions[0]?.startedAt || null,
    };
  } catch (err) {
    return { total: 0, success: 0, errors: 0, rate: '0%', latency: '0s', lastRun: null };
  }
}

export async function getRecentExecutions(limit = 10) {
  try {
    const executions = await getExecutions(limit);
    const workflows = await getWorkflows();
    const wfMap: Record<string, string> = {};
    workflows.forEach((wf: any) => { wfMap[wf.id] = wf.name; });

    return executions.map((e: any) => ({
      id: e.id,
      workflowId: e.workflowId,
      workflowName: wfMap[e.workflowId] || `Workflow ${e.workflowId}`,
      status: e.status,
      mode: e.mode,
      startedAt: e.startedAt,
      duration: e.startedAt && e.stoppedAt
        ? `${((new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()) / 1000).toFixed(1)}s`
        : '-',
    }));
  } catch (err) {
    return [];
  }
}
