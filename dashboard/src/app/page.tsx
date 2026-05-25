'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  Settings,
  Database,
  MessageSquare,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'inicio' | 'flujos' | 'historial' | 'sheets' | 'whatsapp' | 'ajustes';

const SHEETS = [
  {
    id: 'dossier',
    name: 'Dossier Clientes',
    sheetId: '1FVEvCj2ZkRLM2q843CoOlaPhCmZ1JFZEpLsIOiq8ZEc',
    columns: ['Nombre Comercial', 'Razón Social', 'CIF/NIF', 'WhatsApp Negocio', 'Dirección'],
    color: 'sky',
  },
  {
    id: 'pagos',
    name: 'Registro de Pagos',
    sheetId: '1XYMXFyD5jI5StozHS_j_VJczv7etMgPEfMICFB2lrY',
    columns: ['Fecha', 'Referencia', 'Cliente', 'Email', 'Empresa', 'Plan', 'Base', 'IVA', 'Total', 'ID Transacción'],
    color: 'emerald',
  },
  {
    id: 'formulario',
    name: 'Formulario Web Nuevos Clientes',
    sheetId: '1dUzKmu3qSZHniodQoqV4GbXEXDNDqe4qvlz6ehAEXQs',
    columns: ['Nombre Contacto', 'Nombre Restaurante', 'Email Corporativo', 'Teléfono'],
    color: 'violet',
  },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [stats, setStats] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sRes, wRes, eRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/workflows'),
        fetch('/api/executions'),
      ]);
      const [s, w, e] = await Promise.all([sRes.json(), wRes.json(), eRes.json()]);
      setStats(s);
      setWorkflows(Array.isArray(w) ? w : []);
      setExecutions(Array.isArray(e) ? e : []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
  };

  const N8N_BASE = 'https://n8n.opsdining.com';

  return (
    <div className="flex h-screen bg-[#0F172A] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0B1120]">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider">Ops Dining</p>
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Centro de Mandos</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem tab="inicio" current={tab} setTab={setTab} icon={<LayoutDashboard size={18} />} label="Panel Principal" />
          <NavItem tab="flujos" current={tab} setTab={setTab} icon={<Zap size={18} />} label="Workflows" badge={workflows.filter(w => w.active).length} />
          <NavItem tab="historial" current={tab} setTab={setTab} icon={<Activity size={18} />} label="Historial Ejecuciones" />
          <NavItem tab="sheets" current={tab} setTab={setTab} icon={<FileSpreadsheet size={18} />} label="Google Sheets" />
          <NavItem tab="whatsapp" current={tab} setTab={setTab} icon={<MessageSquare size={18} />} label="WhatsApp" />
          <NavItem tab="ajustes" current={tab} setTab={setTab} icon={<Settings size={18} />} label="Ajustes" />
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sistema Online</span>
          </div>
          {lastRefresh && (
            <p className="text-[9px] text-slate-600 mt-2 text-center">
              Actualizado: {lastRefresh.toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5 px-8 h-16 flex items-center justify-between">
          <h1 className="font-black text-lg">
            {tab === 'inicio' && 'Panel Principal'}
            {tab === 'flujos' && 'Workflows de Automatización'}
            {tab === 'historial' && 'Historial de Ejecuciones'}
            {tab === 'whatsapp' && 'WhatsApp — Comunicaciones'}
            {tab === 'ajustes' && 'Ajustes'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
            >
              {refreshing
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCcw size={14} />}
              Actualizar
            </button>
            <a
              href={N8N_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-xl text-xs font-black transition-all"
            >
              <ExternalLink size={14} />
              Abrir n8n
            </a>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ─── INICIO ─── */}
            {tab === 'inicio' && (
              <motion.div key="inicio" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                {/* KPIs reales */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Ejecuciones" value={stats?.total ?? '…'} color="sky" />
                  <KpiCard label="Tasa de Éxito" value={stats?.rate ?? '…'} color="emerald" />
                  <KpiCard label="Errores" value={stats?.errors ?? '…'} color={stats?.errors > 0 ? 'rose' : 'slate'} />
                  <KpiCard label="Latencia Media" value={stats?.latency ?? '…'} color="amber" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Últimas ejecuciones */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Últimas Ejecuciones</h2>
                      <button onClick={() => setTab('historial')} className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
                        Ver todas <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {executions.slice(0, 6).map(ex => (
                        <ExecutionRow key={ex.id} ex={ex} formatDate={formatDate} n8nBase={N8N_BASE} />
                      ))}
                    </div>
                  </div>

                  {/* Workflows activos */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Flujos Activos</h2>
                      <button onClick={() => setTab('flujos')} className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
                        Gestionar <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {workflows.map(wf => (
                        <WorkflowRow key={wf.id} wf={wf} n8nBase={N8N_BASE} />
                      ))}
                      {workflows.length === 0 && <p className="text-sm text-slate-500">Sin workflows cargados</p>}
                    </div>
                  </div>
                </div>

                {/* Último error si existe */}
                {stats?.errors > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <AlertTriangle size={18} className="text-rose-400" />
                    <p className="text-sm font-bold text-rose-300">
                      {stats.errors} ejecución(es) con error en el último historial.
                      <button onClick={() => setTab('historial')} className="ml-2 underline text-rose-400">Ver historial →</button>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── FLUJOS ─── */}
            {tab === 'flujos' && (
              <motion.div key="flujos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {workflows.map(wf => (
                  <div key={wf.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-sky-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-3 h-3 rounded-full', wf.active ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600')} />
                      <div>
                        <p className="font-bold text-white group-hover:text-sky-400 transition-colors">{wf.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold">
                          {wf.active ? '● Activo' : '○ Pausado'} · ID: {wf.id}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`${N8N_BASE}/workflow/${wf.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-sky-500/10 hover:text-sky-400 border border-white/10 rounded-xl text-xs font-bold transition-all"
                    >
                      <ExternalLink size={12} />
                      Abrir en n8n
                    </a>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ─── HISTORIAL ─── */}
            {tab === 'historial' && (
              <motion.div key="historial" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        <th className="px-5 py-4">ID</th>
                        <th className="px-5 py-4">Workflow</th>
                        <th className="px-5 py-4">Estado</th>
                        <th className="px-5 py-4">Modo</th>
                        <th className="px-5 py-4">Duración</th>
                        <th className="px-5 py-4">Fecha</th>
                        <th className="px-5 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map(ex => (
                        <tr key={ex.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-3 font-mono text-[11px] text-slate-500">#{ex.id}</td>
                          <td className="px-5 py-3 font-bold text-sm max-w-xs truncate">{ex.workflowName}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={ex.status} />
                          </td>
                          <td className="px-5 py-3 text-[11px] text-slate-400 uppercase font-bold">{ex.mode}</td>
                          <td className="px-5 py-3 text-[11px] text-slate-400 font-mono">{ex.duration}</td>
                          <td className="px-5 py-3 text-[11px] text-slate-400">{formatDate(ex.startedAt)}</td>
                          <td className="px-5 py-3">
                            <a
                              href={`${N8N_BASE}/workflow/${ex.workflowId}/executions/${ex.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400 hover:text-sky-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── SHEETS ─── */}
            {tab === 'sheets' && (
              <motion.div key="sheets" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {SHEETS.map(sheet => {
                    const colors: any = {
                      sky: 'border-sky-500/30 hover:border-sky-500/60',
                      emerald: 'border-emerald-500/30 hover:border-emerald-500/60',
                      violet: 'border-violet-500/30 hover:border-violet-500/60',
                    };
                    const iconColors: any = {
                      sky: 'bg-sky-500/10 text-sky-400',
                      emerald: 'bg-emerald-500/10 text-emerald-400',
                      violet: 'bg-violet-500/10 text-violet-400',
                    };
                    return (
                      <div key={sheet.id} className={cn('bg-white/[0.03] border rounded-2xl p-5 flex flex-col gap-4 transition-all', colors[sheet.color])}>
                        <div className="flex items-start justify-between">
                          <div className={cn('p-3 rounded-xl', iconColors[sheet.color])}>
                            <FileSpreadsheet size={20} />
                          </div>
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${sheet.sheetId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-black transition-all"
                          >
                            <ExternalLink size={11} />
                            Abrir Hoja
                          </a>
                        </div>
                        <div>
                          <p className="font-black text-sm text-white">{sheet.name}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">{sheet.sheetId.slice(0, 20)}…</p>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Columnas</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sheet.columns.map(col => (
                              <span key={col} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] font-bold text-slate-400">{col}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-center py-4 text-xs text-slate-600 border border-dashed border-white/5 rounded-xl">
                          Sin datos aún — la hoja está vacía
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                  <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-300">Para leer datos en tiempo real desde este panel:</p>
                    <p className="text-xs text-slate-400">Necesito un <strong className="text-white">Google API Key</strong> con la Sheets API activada, o que compartas las hojas como públicas de sólo lectura. Cuando quieras activarlo, dímelo y lo conecto en 5 minutos.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── WHATSAPP ─── */}
            {tab === 'whatsapp' && (
              <motion.div key="whatsapp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Estado de la API */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Estado de Evolution API</h2>
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">API Conectada (Puerto 8082)</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Evolution API en <code className="font-mono">178.104.234.176:8082</code> configurada y operativa.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Para conectar WhatsApp real, necesito:</p>
                      <div className="flex items-start gap-2">
                        <span className="text-sky-400 font-black">1.</span>
                        <p>Que tu n8n guarde los mensajes entrantes en una tabla (Google Sheets o n8n Data Store).</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sky-400 font-black">2.</span>
                        <p>O abrir el puerto 8080 del VPS al exterior (con autenticación).</p>
                      </div>
                    </div>
                  </div>

                  {/* Links directos */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Acceso Directo</h2>
                    <a
                      href="https://web.whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">W</div>
                        <div>
                          <p className="font-bold text-sm text-white">WhatsApp Web</p>
                          <p className="text-[10px] text-emerald-400">web.whatsapp.com →</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-400" />
                    </a>
                    <a
                      href="https://n8n.opsdining.com/workflow/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-lg">n</div>
                        <div>
                          <p className="font-bold text-sm text-white">Crear Workflow WhatsApp</p>
                          <p className="text-[10px] text-sky-400">Guardar mensajes en tabla →</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-sky-400" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── AJUSTES ─── */}
            {tab === 'ajustes' && (
              <motion.div key="ajustes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-2xl">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Credenciales Activas</h2>
                  <InfoRow label="URL n8n" value="n8n.opsdining.com" link="https://n8n.opsdining.com" />
                  <InfoRow label="Evolution API" value="178.104.234.176:8082" status="success" />
                  <InfoRow label="Google Sheets" value="Sin credenciales configuradas" status="error" note="Necesitas una URL de Sheets o Service Account" />
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Accesos Directos</h2>
                  <a href="https://n8n.opsdining.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="font-bold text-sm">Panel n8n</span>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-400" />
                  </a>
                  <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="font-bold text-sm">Google Drive (tus hojas)</span>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-400" />
                  </a>
                  <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="font-bold text-sm">WhatsApp Web</span>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-400" />
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ──

function NavItem({ tab, current, setTab, icon, label, badge }: any) {
  const active = tab === current;
  return (
    <button
      onClick={() => setTab(tab)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left',
        active
          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full">{badge}</span>
      )}
    </button>
  );
}

function KpiCard({ label, value, color }: any) {
  const colorMap: any = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    slate: 'text-slate-400',
  };
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className={cn('text-3xl font-black tabular-nums', colorMap[color])}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded text-[10px] font-black uppercase',
      status === 'success' && 'bg-emerald-500/10 text-emerald-400',
      status === 'error' && 'bg-rose-500/10 text-rose-400',
      status === 'waiting' && 'bg-amber-500/10 text-amber-400',
    )}>
      {status === 'success' ? 'Éxito' : status === 'error' ? 'Error' : status}
    </span>
  );
}

function ExecutionRow({ ex, formatDate, n8nBase }: any) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl group transition-colors">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', ex.status === 'success' ? 'bg-emerald-400' : ex.status === 'error' ? 'bg-rose-400' : 'bg-amber-400')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white/80 truncate">{ex.workflowName}</p>
        <p className="text-[9px] text-slate-500">{formatDate(ex.startedAt)} · {ex.duration}</p>
      </div>
      <a href={`${n8nBase}/workflow/${ex.workflowId}/executions/${ex.id}`} target="_blank" rel="noopener noreferrer"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-sky-400">
        <ChevronRight size={14} />
      </a>
    </div>
  );
}

function WorkflowRow({ wf, n8nBase }: any) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl group transition-colors">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', wf.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} />
      <span className="flex-1 text-xs font-bold text-white/80 truncate">{wf.name}</span>
      <a href={`${n8nBase}/workflow/${wf.id}`} target="_blank" rel="noopener noreferrer"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-sky-400">
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

function InfoRow({ label, value, link, status, note }: any) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/5 last:border-0">
      <div>
        <p className="text-xs font-black text-slate-400 uppercase">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-sky-400 hover:underline flex items-center gap-1">
            {value} <ExternalLink size={10} />
          </a>
        ) : (
          <p className={cn('text-sm font-bold', status === 'error' ? 'text-rose-400' : status === 'warning' ? 'text-amber-400' : 'text-white/80')}>{value}</p>
        )}
        {note && <p className="text-[10px] text-slate-500 mt-0.5">{note}</p>}
      </div>
      {status && (
        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded',
          status === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
        )}>
          {status === 'error' ? 'Sin config' : 'Sin acceso'}
        </span>
      )}
    </div>
  );
}
