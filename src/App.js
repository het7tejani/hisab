import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import DailyTotal from './components/DailyTotal';
import EntryList from './components/EntryList';
import ManualEntry from './components/ManualEntry';
import MonthlyView from './components/MonthlyView';
import { useExpenses, useMonthly } from './hooks/useExpenses';

export default function App() {
  const { todayData, loading: todayLoading, error, addEntry, deleteEntry } = useExpenses();
  const { loading: monthlyLoading, refresh: refreshMonthly } = useMonthly();
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('activeTab') || 'today';
  });
  const [currentMode, setCurrentModeState] = useState(() => {
    return localStorage.getItem('currentMode') || 'home';
  });

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  }, []);

  const setCurrentMode = useCallback((mode) => {
    setCurrentModeState(mode);
    localStorage.setItem('currentMode', mode);
  }, []);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: '',
  });

  const loading = todayLoading || monthlyLoading;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: '' }), 2500);
  }, []);

  const handleAdd = useCallback(
    async (entry) => {
      try {
        await addEntry(entry);
        refreshMonthly();
        showToast(`Added ₹${entry.amount} for ${entry.description}`);
      } catch (err) {
        showToast('Failed to add entry', 'error');
      }
    },
    [addEntry, refreshMonthly, showToast]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteEntry(id);
        refreshMonthly();
        showToast('Entry deleted');
      } catch (err) {
        showToast('Failed to delete', 'error');
      }
    },
    [deleteEntry, refreshMonthly, showToast]
  );

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading">
          <div className="loading__spinner" />
          <div className="loading__text">Loading your hisab...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <div className="empty-state__text">
            Can't connect to server
            <br />
            <small style={{ color: 'var(--text-muted)' }}>{error}</small>
          </div>
          <div className="empty-state__hint">
            The free cloud server might be spinning up from sleep mode. Please wait up to a minute or refresh.
          </div>
        </div>
      </div>
    );
  }

  // Filter Today Data depending on Mode Selection (Home/Office)
  // Non-office entries default to Home/Personal space
  const filteredTodayData = todayData.data.filter((entry) => {
    if (currentMode === 'office') {
      return entry.category === 'office';
    } else {
      return entry.category !== 'office';
    }
  });

  const filteredTotal = filteredTodayData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const filteredCount = filteredTodayData.length;

  // Compute cumulative (all-time) status for office to carry over across all months
  const officeCumulative = todayData?.officeCumulative || { totalImports: 0, totalPaid: 0, netDue: 0 };
  const totalImports = officeCumulative.totalImports;
  const totalPaid = officeCumulative.totalPaid;
  const netDue = officeCumulative.netDue;

  return (
    <div className="app">
      <Header />

      {/* Live status indicator */}
      <div className="status-bar">
        <span className="live-dot" />
        <span className="status-bar__text">Auto-refreshing every 15s</span>
      </div>

      {/* Home / Office Mode Toggle Switcher */}
      <div className="mode-toggle" id="mode-switcher-container">
        <button
          className={`mode-btn ${currentMode === 'home' ? 'mode-btn--active-home' : ''}`}
          onClick={() => setCurrentMode('home')}
          id="mode-btn-home"
        >
          🏠 Personal Hisab
        </button>
        <button
          className={`mode-btn ${currentMode === 'office' ? 'mode-btn--active-office' : ''}`}
          onClick={() => setCurrentMode('office')}
          id="mode-btn-office"
        >
          🏢 Office Hisab
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs" id="tab-nav">
        <button
          className={`tab ${activeTab === 'today' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('today')}
          id="tab-today"
        >
          📅 Today
        </button>
        <button
          className={`tab ${activeTab === 'monthly' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('monthly')}
          id="tab-monthly"
        >
          📊 Monthly
        </button>
      </div>

      {/* Today View */}
      {activeTab === 'today' && (
        <>
          <DailyTotal
            total={filteredTotal}
            count={filteredCount}
            currentMode={currentMode}
            totalImports={totalImports}
            totalPaid={totalPaid}
            netDue={netDue}
          />
          <EntryList entries={filteredTodayData} onDelete={handleDelete} currentMode={currentMode} />
          <ManualEntry onAdd={handleAdd} currentMode={currentMode} />
        </>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && <MonthlyView currentMode={currentMode} />}

      {/* Toast Notification */}
      <div
        className={`toast ${toast.visible ? 'toast--visible' : ''} ${
          toast.type === 'error' ? 'toast--error' : 'toast--success'
        }`}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>
    </div>
  );
}
