import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface BankAccount {
  id: string;
  label: string;
  type: 'transactional' | 'fee' | 'receiving';
  bank: string;
  branch: string;
  account: string;
  digit: string;
  tax_number?: string;
  holder_name: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
}

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState<{[key: string]: boolean}>({});
  const { makeRequest, loading, error } = useApi();

  const [formData, setFormData] = useState({
    label: '',
    type: 'transactional' as 'transactional' | 'fee' | 'receiving',
    bank: '',
    branch: '',
    account: '',
    digit: '',
    tax_number: '',
    holder_name: '',
    account_type: '0'
  });

  const loadAccounts = async () => {
    try {
      const data = await makeRequest('/accounts');
      setAccounts(data);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadFullAccount = async (id: string) => {
    try {
      const data = await makeRequest(`/accounts/${id}`);
      return data;
    } catch (err) {
      console.error('Error loading full account:', err);
      return null;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      label: '',
      type: 'transactional',
      bank: '',
      branch: '',
      account: '',
      digit: '',
      tax_number: '',
      holder_name: '',
      account_type: '0'
    });
    setEditingAccount(null);
  };

  const openModal = async (account?: BankAccount) => {
    if (account) {
      const fullAccount = await loadFullAccount(account.id);
      if (fullAccount) {
        setFormData({
          label: fullAccount.label,
          type: fullAccount.type,
          bank: fullAccount.bank,
          branch: fullAccount.branch,
          account: fullAccount.account,
          digit: fullAccount.digit,
          tax_number: fullAccount.tax_number || '',
          holder_name: fullAccount.holder_name,
          account_type: fullAccount.account_type || '0'
        });
        setEditingAccount(fullAccount);
      }
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        await makeRequest(`/accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await makeRequest('/accounts', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      await loadAccounts();
      closeModal();
    } catch (err) {
      console.error('Error saving account:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    try {
      await makeRequest(`/accounts/${id}`, { method: 'DELETE' });
      await loadAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const toggleSensitiveData = (accountId: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transactional': return 'bg-green-100 text-green-800';
      case 'fee': return 'bg-orange-100 text-orange-800';
      case 'receiving': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transactional': return 'Transacional';
      case 'fee': return 'Taxa';
      case 'receiving': return 'Recebimento';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Contas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas contas bancárias</p>
        </div>
        
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {loading && accounts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma conta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      account.type === 'transactional' 
                        ? 'bg-green-500' 
                        : account.type === 'fee'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{account.label}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(account.type)}`}>
                          {getTypeLabel(account.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{account.holder_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">
                          Banco: {account.bank} | Agência: {account.branch} | 
                          Conta: {showSensitiveData[account.id] ? account.account : account.account} | 
                          Dígito: {account.digit}
                        </p>
                        <button
                          onClick={() => toggleSensitiveData(account.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showSensitiveData[account.id] ? 
                            <EyeOff className="w-4 h-4" /> : 
                            <Eye className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(account)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Conta
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="transactional">Transacional</option>
                    <option value="fee">Taxa</option>
                    <option value="receiving">Recebimento</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agência
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conta
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.account}
                      onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dígito
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.digit}
                      onChange={(e) => setFormData({ ...formData, digit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Titular
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.holder_name}
                    onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <Save className="w-4 h-4" />
                    {loading ? 'Salvando...' : 'Salvar'}
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