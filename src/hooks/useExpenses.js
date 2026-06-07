import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

const POLL_INTERVAL = 15000; // 15 seconds

export function useExpenses() {
  const [todayData, setTodayData] = useState({
    total: 0,
    count: 0,
    byCategory: {},
    data: [],
    date: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchToday = useCallback(async () => {
    try {
      const result = await api.getToday();
      if (result.success) {
        setTodayData(result);
        setError(null);
      } else {
        setError('Server responded with an unsuccessful status.');
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchToday();
    intervalRef.current = setInterval(fetchToday, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchToday]);

  const addEntry = useCallback(
    async ({ amount, description, category, items }) => {
      try {
        const result = await api.addManualEntry({ amount, description, category, items });
        if (result.success) {
          await fetchToday(); // refresh immediately
        }
        return result;
      } catch (err) {
        throw err;
      }
    },
    [fetchToday]
  );

  const deleteEntry = useCallback(
    async (id) => {
      try {
        await api.deleteEntry(id);
        await fetchToday(); // refresh
      } catch (err) {
        throw err;
      }
    },
    [fetchToday]
  );

  const refresh = useCallback(() => {
    fetchToday();
  }, [fetchToday]);

  return {
    todayData,
    loading,
    error,
    addEntry,
    deleteEntry,
    refresh,
  };
}

export function useMonthly(initialMonth) {
  const [month, setMonth] = useState(initialMonth || getCurrentMonth());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [monthlyData, setMonthlyData] = useState({
    total: 0,
    count: 0,
    byCategory: {},
    byDate: {},
    data: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .getMonthlySummary(month)
      .then((result) => {
        if (!cancelled && result.success) {
          setMonthlyData(result);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [month, refreshTrigger]);

  const prevMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [month]);

  const nextMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [month]);

  return {
    month,
    monthlyData,
    loading,
    prevMonth,
    nextMonth,
    refresh,
  };
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
