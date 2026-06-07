import React, { useState, useCallback } from 'react';
import './index.css';
import { Header } from './components/Header';
import { DailyTotal } from './components/DailyTotal';
import { EntryList } from './components/EntryList';
import { ManualEntry } from './components/ManualEntry';
import { MonthlyView } from './components/MonthlyView';
import { useExpenses } from './hooks/useExpenses';

function App() {
  const { todayData, loading, error, addEntry, deleteEntry } = useExpenses();
  const [activeTab, setActiveTab] = useState('today');
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: '' }), 2500);
  }, []);

  const handleAdd = useCallback(
    async (entry) => {
      try {
        await addEntry(entry);
        showToast(`Added ₹${entry.amount} for ${entry.description}`);
      } catch (err) {
        showToast('Failed to add entry', 'error');
      }
    },
    [addEntry, showToast]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteEntry(id);
        showToast('Entry deleted');
      } catch (err) {
        showToast('Failed to delete', 'error');
      }
    },
    [deleteEntry, showToast]
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

  return (
    <div className="app">
      <Header />

      {/* Live status indicator */}
      <div className="status-bar">
        <span className="live-dot" />
        <span className="status-bar__text">Auto-refreshing every 15s</span>
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
            total={todayData.total}
            count={todayData.count}
            byCategory={todayData.byCategory}
          />
          <EntryList entries={todayData.data} onDelete={handleDelete} />
          <ManualEntry onAdd={handleAdd} />
        </>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && <MonthlyView />}

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

export default App;