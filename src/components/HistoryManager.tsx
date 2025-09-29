import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id?: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  created_at: string;
}

export const HistoryManager: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const { makeRequest, loading, error } = useApi();

  const loadAuditLogs = async () => {
    try {
      // Como não temos endpoint de audit logs ainda, vamos simular com dados dos PIX
      const pixData = await makeRequest('/pix/out');
      
      // Converter dados PIX para formato de audit log
      const auditLogs = pixData.map((pix: any) => ({
        id: pix.id,
        user_id: pix.created_by || 'system',
        action: 'PIX_OUT_CREATED',
        entity: 'pix_out_request',
        entity_id: pix.id,
        ip_address: '127.0.0.1',
        user_agent: 'FitBank Panel',
        metadata: {
          value: pix.value,
          to_name: pix.to_name,
          status: pix.status
        },
        created_at: pix.created_at
      }));
      
      setLogs(auditLogs);
      setFilteredLogs(auditLogs);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, actionFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('PIX')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <User className="w-4 h-4" />;
    if (action.includes('PIX')) return <Activity className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'LOGIN_SUCCESS': 'Login realizado',
      'LOGIN_FAILED': 'Falha no login',
      'PIX_OUT_CREATED': 'PIX OUT criado',
      'ACCOUNT_CREATED': 'Conta criada',
      'ACCOUNT_UPDATED': 'Conta atualizada',
      'ACCOUNT_DELETED': 'Conta excluída',
      'BALANCE_REFRESH': 'Saldos atualizados'
    };
    return labels[action] || action;
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Histórico de Auditoria</h1>
        <p className="text-gray-600 mt-1">Registro de todas as ações do sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ação, entidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Ação
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as ações</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {getActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Registros de Auditoria ({filteredLogs.length})
          </h2>
        </div>

        <div className="p-6">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {logs.length === 0 ? 'Nenhum registro encontrado' : 'Nenhum registro corresponde aos filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {getActionLabel(log.action)}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {log.entity}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </p>
                      <p>IP: {log.ip_address}</p>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Detalhes:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>ID: {log.entity_id?.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};