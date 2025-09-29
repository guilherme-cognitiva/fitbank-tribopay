import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AccountsManager } from './components/AccountsManager';
import { MovementsManager } from './components/MovementsManager';
import { HistoryManager } from './components/HistoryManager';
import { PixKeysManager } from './components/PixKeysManager';

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsManager />;
      case 'movements':
        return <MovementsManager />;
      case 'history':
        return <HistoryManager />;
      case 'pix-keys':
        return <PixKeysManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;