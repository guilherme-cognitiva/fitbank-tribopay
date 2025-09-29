import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Building2
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BankAccount {
  id: string;
  label: string;
  type: string;
  holder_name: string;
}

interface PixOutRequest {
  id: string;
  document_number: string;
  identifier: string;
  value: number;
  payment_date: string;
  description?: string;
  status: string;
  to_name?: string;
  to_account_masked?: string;
  receipt_url?: string;
  created_at: string;
  from_account?: BankAccount;
  to_account?: BankAccount;
}

export const MovementsManager: React.FC = () => {
  const [movements, setMovements] = useState<PixOutRequest[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { makeRequest, loading, error } = useApi();

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    toName: '',
    toTaxNumber: '',
    toBank: '',
    toBranch: '',
    toAccount: '',
    toAccountDigit: '',
    value: '',
    paymentDate: format(new Date(), 'dd/MM/yyyy'),
    description: ''
  });

  const loadMovements = async () => {
    try {
      const data = await makeRequest('/pix/out');
      setMovements(data);
    } catch (err) {
      console.error('Error loading movements:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await makeRequest('/accounts');
      setAccounts(data);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  useEffect(() => {
    loadMovements();
    loadAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      fromAccountId: '',
      toAccountId: '',
      toName: '',
      toTaxNumber: '',
      toBank: '',
      toBranch: '',
      toAccount: '',
      toAccountDigit: '',
      value: '',
      paymentDate: format(new Date(), 'dd/MM/yyyy'),
      description: ''
    });
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        fromAccountId: formData.fromAccountId,
        value: parseFloat(formData.value),
        paymentDate: formData.paymentDate,
        description: formData.description
      };

      if (formData.toAccountId) {
        payload.toAccountId = formData.toAccountId;
      } else {
        payload.toName = formData.toName;
        payload.toTaxNumber = formData.toTaxNumber;
        payload.toBank = formData.toBank;
        payload.toBranch = formData.toBranch;
        payload.toAccount = formData.toAccount;
        payload.toAccountDigit = formData.toAccountDigit;
      }

      await makeRequest('/pix/out', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      await loadMovements();
      closeModal();
    } catch (err) {
      console.error('Error creating PIX OUT:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Sucesso';
      case 'failed': return 'Falhou';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimentações</h1>
          <p className="text-gray-600 mt-1">PIX OUT e transferências</p>
        </div>
        
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo PIX OUT
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Histórico de Movimentações</h2>
        </div>

        <div className="p-6">
          {loading && movements.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(movement.status)}`}>
                      {getStatusIcon(movement.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          PIX OUT - {formatCurrency(movement.value)}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(movement.status)}`}>
                          {getStatusLabel(movement.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Para: {movement.to_name} ({movement.to_account_masked})
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {movement.description && (
                        <p className="text-sm text-gray-500 mt-1">{movement.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Doc: {movement.document_number}</p>
                    {movement.receipt_url && (
                      <a
                        href={movement.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Ver Comprovante
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal} />
            
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Novo PIX OUT</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta de Origem
                  </label>
                  <select
                    required
                    value={formData.fromAccountId}
                    onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.filter(acc => acc.type === 'transactional').map(account => (
                      <option key={account.id} value={account.id}>
                        {account.label} - {account.holder_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Pagamento
                    </label>
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta de Destino (opcional)
                  </label>
                  <select
                    value={formData.toAccountId}
                    onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Ou preencha os dados manualmente</option>
                    {accounts.filter(acc => acc.type === 'fee').map(account => (
                      <option key={account.id} value={account.id}>
                        {account.label} - {account.holder_name}
                      </option>
                    ))}
                  </select>
                </div>

                {!formData.toAccountId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Destinatário
                      </label>
                      <input
                        type="text"
                        required={!formData.toAccountId}
                        value={formData.toName}
                        onChange={(e) => setFormData({ ...formData, toName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CPF/CNPJ
                        </label>
                        <input
                          type="text"
                          value={formData.toTaxNumber}
                          onChange={(e) => setFormData({ ...formData, toTaxNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Banco
                        </label>
                        <input
                          type="text"
                          required={!formData.toAccountId}
                          value={formData.toBank}
                          onChange={(e) => setFormData({ ...formData, toBank: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Agência
                        </label>
                        <input
                          type="text"
                          required={!formData.toAccountId}
                          value={formData.toBranch}
                          onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Conta
                        </label>
                        <input
                          type="text"
                          required={!formData.toAccountId}
                          value={formData.toAccount}
                          onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dígito
                        </label>
                        <input
                          type="text"
                          required={!formData.toAccountId}
                          value={formData.toAccountDigit}
                          onChange={(e) => setFormData({ ...formData, toAccountDigit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Enviando...' : 'Enviar PIX'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};