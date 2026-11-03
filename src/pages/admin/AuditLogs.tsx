import React, { useState, useEffect } from 'react';
import { api, AuditLog } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auditLogs
      .list(200)
      .then((res) => setLogs(res.logs))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATED') || action.includes('SUCCESS')) return 'green';
    if (action.includes('FAILED') || action.includes('DELETED')) return 'red';
    if (action.includes('SUBMITTED') || action.includes('STARTED')) return 'purple';
    return 'gray';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-[#7B0FE8]" />
          <span>Security & Audit Trails</span>
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Immutable event log of all system actions, authentication events, and candidate quiz attempts.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>System Audit Stream ({filteredLogs.length} events)</CardTitle>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs or users..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B0FE8]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Event Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-neutral-900 text-xs">{log.user_name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)} mono className="text-[11px]">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-neutral-700 leading-relaxed">{log.details}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
