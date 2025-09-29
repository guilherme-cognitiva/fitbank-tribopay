import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Search, 
  Building2,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface BankAccount {
  id: string;
  label: string;
  type: string;
  holder_name: string;
}

interface PixKey {
  key: string;
  type: string;
  status: string;
}

export const PixKeysManager: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const { makeRequest, loading, error } = useApi();

  const loadAccounts = async () => {
    try {
      const data = await makeRequest('/accounts');
      setAccounts(data);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadPixKeys = async (accountId: string) => {
    if (!accountId) return;
    
    setIsLoading(true);
    try {
      const response = await makeRequest(`/pix/keys/${accountId}`);
      if (response.success) {
        setPixKeys(response.keys || []);
      } else {
        setPixKeys([]);
        console.error('Error loading PIX keys:', response.error);
      }
    } catch (err) {
      setPixKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadPixKeys(selectedAccountId);
    } else {
      setPixKeys([]);
    }
  }, [selectedAccountId]);

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getKeyTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'CPF': 'CPF',
      'CNPJ': 'CNPJ',
      'EMAIL': 'E-mail',
      'PHONE': 'Telefone',
      'EVP': 'Chave Aleatória'
    };
    return types[type] || type;
  };

  const getKeyTypeColor = (type: string) => {
    switch (type) {
      case 'CPF': return 'bg-blue-100 text-blue-800';
      case 'CNPJ': return 'bg-green-100 text-green-800';
      case 'EMAIL': return 'bg-purple-100 text-purple-800';
      case 'PHONE': return 'bg-orange-100 text-orange-800';
      case 'EVP': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'pending': return 'Pendente';
      default: return status || 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chaves PIX</h1>
        <p className="text-gray-600 mt-1">Consulte as chaves PIX das suas contas</p>
      </div>

      {/* Seletor de Conta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione uma conta para consultar as chaves PIX
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.label} - {account.holder_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => selectedAccountId && loadPixKeys(selectedAccountId)}
            disabled={!selectedAccountId || isLoading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de Chaves PIX */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Chaves PIX {selectedAccountId && `(${pixKeys.length})`}
          </h2>
        </div>

        <div className="p-6">
          {!selectedAccountId ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Selecione uma conta para consultar as chaves PIX</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pixKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma chave PIX encontrada para esta conta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pixKeys.map((pixKey, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Key className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getKeyTypeColor(pixKey.type)}`}>
                          {getKeyTypeLabel(pixKey.type)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pixKey.status)}`}>
                          {getStatusLabel(pixKey.status)}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                        {pixKey.key}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(pixKey.key)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {copiedKey === pixKey.key ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAccountId && pixKeys.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Dica:</strong> Use essas chaves para receber PIX ou configurar transferências automáticas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};