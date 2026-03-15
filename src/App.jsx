import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TransactionsPage from './pages/TransactionsPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'projects':
        return <ProjectsPage />;
      case 'transactions':
        return <TransactionsPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </AppProvider>
  );
}
