import { HistoryItem, MarketingReport } from '../types';

const STORAGE_KEY = 'tv_marketing_history_v1';
const MAX_ITEMS = 20;

export const saveReport = (report: MarketingReport): HistoryItem[] => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...report,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const updatedHistory = [newItem, ...history].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const getHistory = (): HistoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as HistoryItem[];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const deleteReport = (id: string): HistoryItem[] => {
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = (): HistoryItem[] => {
  localStorage.removeItem(STORAGE_KEY);
  return [];
};