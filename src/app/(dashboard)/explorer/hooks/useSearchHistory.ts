'use client';

import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  address: string;
  timestamp: number;
}

const STORAGE_KEY = 'explorer_search_history';
const MAX_HISTORY = 10;

/**
 * Hook for managing address search history in session storage.
 * History persists during the browser session but is cleared when the tab/window closes.
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from session storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.warn('Failed to load search history from session storage:', error);
    }
  }, []);

  // Add an address to the history
  const addToHistory = useCallback((address: string) => {
    if (!address || address.trim().length === 0) return;

    const normalizedAddress = address.trim();

    setHistory((prevHistory) => {
      // Create new item
      const newItem: SearchHistoryItem = {
        address: normalizedAddress,
        timestamp: Date.now()
      };

      // Remove any existing entry with the same address (case-insensitive)
      const filteredHistory = prevHistory.filter(
        (item) => item.address.toLowerCase() !== normalizedAddress.toLowerCase()
      );

      // Add new item at the beginning and limit to max history
      const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY);

      // Persist to session storage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.warn('Failed to save search history to session storage:', error);
      }

      return updatedHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear search history from session storage:', error);
    }
  }, []);

  // Remove a specific item from history
  const removeFromHistory = useCallback((address: string) => {
    setHistory((prevHistory) => {
      const updatedHistory = prevHistory.filter(
        (item) => item.address.toLowerCase() !== address.toLowerCase()
      );

      try {
        if (updatedHistory.length > 0) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.warn('Failed to update search history in session storage:', error);
      }

      return updatedHistory;
    });
  }, []);

  return {
    /** List of recent addresses, most recent first */
    history,
    /** Add an address to the history (duplicates are moved to top) */
    addToHistory,
    /** Remove all history items */
    clearHistory,
    /** Remove a specific address from history */
    removeFromHistory
  };
}
