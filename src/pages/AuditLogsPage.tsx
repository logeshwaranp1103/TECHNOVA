import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLog } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter(l => 
    l.actorName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.targetResource.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'TIMESTAMP',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{row.original.timestamp}</span>,
    },
    {
      accessorKey: 'actorName',
      header: 'ACTOR / ROLE',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-navy text-xs">{row.original.actorName}</div>
          <div className="text-[10px] text-slate-400">{row.original.actorRole}</div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'ACTION',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.severity === 'critical' ? 'danger' :
            row.original.severity === 'warning' ? 'warning' : 'primary'
          }
        >
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: 'targetResource',
      header: 'TARGET RESOURCE',
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-brandBlue">{row.original.targetResource}</span>,
    },
    {
      accessorKey: 'details',
      header: 'DETAILS',
      cell: ({ row }) => <span className="text-xs text-slate-600 truncate max-w-xs block">{row.original.details}</span>,
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP ADDRESS',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{row.original.ipAddress}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row.original)}
        >
          <Eye className="w-4 h-4 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Operational Audit Logs</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Immutable chronological log of all administrator actions, system automated events, and policy changes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => toast.success('Audit logs exported')}>
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by actor, action, target resource..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <Card title="Audit Events Timeline" subtitle="System security and operational history">
        <Table columns={columns} data={filteredLogs} pageSize={10} />
      </Card>

      {/* Detail Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Details - ${selectedLog?.id}`}
        subtitle={selectedLog?.timestamp}
        footer={
          <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
            Close Inspector
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
              <div><span className="text-slate-400 block">Actor</span><strong>{selectedLog.actorName} ({selectedLog.actorRole})</strong></div>
              <div><span className="text-slate-400 block">IP Address</span><strong className="font-mono">{selectedLog.ipAddress}</strong></div>
              <div><span className="text-slate-400 block">Action</span><strong>{selectedLog.action}</strong></div>
              <div><span className="text-slate-400 block">Target</span><strong className="font-mono text-brandBlue">{selectedLog.targetResource}</strong></div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700">Detailed Description</span>
              <p className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 leading-relaxed">{selectedLog.details}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
