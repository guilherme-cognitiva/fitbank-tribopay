import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  Building2,
  AlertCircle 
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Balance {
  id: string;
  balance: number;
  blocked_balance: number;
  updated_at: string;
  bank_account: {
    id: string;
    label: string;
    type: string;
    holder_name: string;
  };
}

export const Dashboard: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { makeRequest, loading, error } = useApi();

  const loadBalances = async () => {
    try {
      const data = await makeRequest('/balances');
      setBalances(data || []);
    } catch (err) {
      console.error('Error loading balances:', err);
      setBalances([]);
    }
  };

  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      await makeRequest('/balances/refresh', { method: 'POST' });
      await loadBalances();
    } catch (err) {
      console.error('Error refreshing balances:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalances();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadBalances, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLastUpdate = () => {
    if (balances.length === 0) return null;
    const latestUpdate = Math.max(
      ...balances.map(b => new Date(b.updated_at).getTime())
    );
    return new Date(latestUpdate);
  };

  const totalBalance = balances.reduce((sum, b) => sum + Number(b.balance), 0);
  const totalBlocked = balances.reduce((sum, b) => sum + Number(b.blocked_balance), 0);
  const lastUpdate = getLastUpdate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral das suas contas</p>
        </div>
        
        <button
          onClick={refreshBalances}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Agora'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Bloqueado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalBlocked)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contas Ativas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {balances.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Última Atualização</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {lastUpdate ? format(lastUpdate, 'HH:mm:ss', { locale: ptBR }) : '--:--:--'}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Saldos por Conta</h2>
          <p className="text-gray-600 mt-1">Detalhamento dos saldos de cada conta</p>
        </div>

        <div className="p-6">
          {loading && balances.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma conta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      balance.bank_account.type === 'transactional' 
                        ? 'bg-green-500' 
                        : balance.bank_account.type === 'fee'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`} />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {balance.bank_account.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {balance.bank_account.holder_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(Number(balance.balance))}
                        </p>
                        {Number(balance.blocked_balance) > 0 && (
                          <p className="text-sm text-orange-600">
                            Bloqueado: {formatCurrency(Number(balance.blocked_balance))}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(balance.updated_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lastUpdate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Próxima atualização automática:</strong> {format(
                new Date(lastUpdate.getTime() + 30 * 60 * 1000), 
                'dd/MM/yyyy às HH:mm', 
                { locale: ptBR }
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};