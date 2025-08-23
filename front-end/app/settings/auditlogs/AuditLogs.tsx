'use client';

import { useEffect, useMemo, useState } from 'react';

// --- types that match your payload ---
type AuditAction =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT'
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'UPSERT'
  | 'BULK_UPDATE' | 'BULK_DELETE' | 'PERMISSION_CHANGE';

type AuditLog = {
  id: string;
  ts: string;
  requestId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldValues?: any | null;
  newValues?: any | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: any | null;
};

// --- small helpers ---
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString();

const cls = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

const actionColor: Record<AuditAction, string> = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-700 ring-green-200',
  LOGIN_FAILURE: 'bg-red-100 text-red-700 ring-red-200',
  LOGOUT:        'bg-amber-100 text-amber-800 ring-amber-200',
  CREATE:        'bg-blue-100 text-blue-700 ring-blue-200',
  UPDATE:        'bg-indigo-100 text-indigo-700 ring-indigo-200',
  DELETE:        'bg-rose-100 text-rose-700 ring-rose-200',
  UPSERT:        'bg-cyan-100 text-cyan-700 ring-cyan-200',
  BULK_UPDATE:   'bg-violet-100 text-violet-700 ring-violet-200',
  BULK_DELETE:   'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  PERMISSION_CHANGE: 'bg-teal-100 text-teal-700 ring-teal-200',
};

function Badge({ action }: { action: AuditAction }) {
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        actionColor[action]
      )}
      title={action}
    >
      {action}
    </span>
  );
}

function JsonPreview({ label, value }: { label: string; value: any }) {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-300 hover:underline">{label}</summary>
      <pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-50 dark:bg-zinc-900 p-2 text-[11px] text-gray-800 dark:text-gray-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>('');
  const [entity, setEntity] = useState<string>('');
  const [actorId, setActorId] = useState<string>('');
  const [qLimit, setQLimit] = useState<string>('50');
  const [from, setFrom] = useState<string>(''); // optional future extension
  const [to, setTo] = useState<string>('');     // optional future extension
  const [page, setPage] = useState<number>(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const url = new URL('http://localhost:8000/audit-logs'); // call Nest directly
      if (action)  url.searchParams.set('action', action);
      if (entity)  url.searchParams.set('entity', entity);
      if (actorId) url.searchParams.set('actorId', actorId);
      url.searchParams.set('limit', qLimit || '50');

      const res = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to load logs: ${res.status}`);
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : (data.items ?? []));
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entity, actorId, qLimit, page]);

  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.entity));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <div className="h-full w-full">
      {/* Header area beneath your global header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-b border-gray-200 dark:border-zinc-800">
        <div className="px-4 lg:px-6 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Audit Logs</h1>
            <button
              onClick={fetchLogs}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-300 dark:border-zinc-700"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2 text-sm"
              >
                <option value="">All</option>
                {[
                  'LOGIN_SUCCESS','LOGIN_FAILURE','LOGOUT',
                  'CREATE','UPDATE','DELETE','UPSERT',
                  'BULK_UPDATE','BULK_DELETE','PERMISSION_CHANGE'
                ].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Entity</label>
              <input
                list="entities"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                placeholder="Shipment, Quote, Auth…"
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
              <datalist id="entities">
                {uniqueEntities.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Actor ID</label>
              <input
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                placeholder="e.g. 2"
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Limit</label>
              <select
                value={qLimit}
                onChange={(e) => setQLimit(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2 text-sm"
              >
                {['25','50','100','200'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="col-span-1 flex items-end">
              <button
                onClick={() => { setAction(''); setEntity(''); setActorId(''); setQLimit('50'); }}
                className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-300 dark:border-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 lg:px-6 py-4">
        <div className="overflow-auto rounded-lg border border-gray-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900">
              <tr className="text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                <th className="px-3 py-2 sticky left-0 bg-gray-50 dark:bg-zinc-900 z-10">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">Record</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {logs.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                    {loading ? 'Loading…' : 'No logs found.'}
                  </td>
                </tr>
              )}

              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/70 dark:hover:bg-zinc-900/50">
                  <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-950 z-10">
                    <div className="text-gray-900 dark:text-gray-100">{fmtDateTime(l.ts)}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">req: {l.requestId ?? '—'}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge action={l.action} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{l.entity}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-gray-800 dark:text-gray-200">{l.entityId ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-900 dark:text-gray-100">{l.actorEmail ?? '—'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {l.actorRole ?? '—'}{l.actorId ? ` · id: ${l.actorId}` : ''}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-gray-800 dark:text-gray-200">{l.ip ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <JsonPreview label="oldValues" value={l.oldValues} />
                      <JsonPreview label="newValues" value={l.newValues} />
                      <JsonPreview label="meta" value={l.meta} />
                      {l.userAgent && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-300 hover:underline">userAgent</summary>
                          <div className="mt-1 text-[11px] text-gray-800 dark:text-gray-200">
                            {l.userAgent}
                          </div>
                        </details>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* simple footer / pagination placeholder */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div>Showing {logs.length} record(s)</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-2 py-1 hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-300 dark:border-zinc-700"
              disabled={page === 1}
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-2 py-1 hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-300 dark:border-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
