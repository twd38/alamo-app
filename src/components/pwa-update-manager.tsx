'use client';

import { useEffect } from 'react';

export default function PWAUpdateManager() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async (): Promise<void> => {
      try {
        const reg: ServiceWorkerRegistration =
          await navigator.serviceWorker.register('/sw.js');

        // Auto-update function
        const applyUpdate = (): void => {
          if (reg.waiting) {
            // Tell the waiting service worker to skip waiting
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });

            // Listen for the controlling service worker to change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              // Reload the page silently to use the new service worker
              window.location.reload();
            });
          }
        };

        // Check for updates and apply them automatically
        reg.addEventListener('updatefound', () => {
          const newWorker: ServiceWorker | null = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker is available - apply update automatically
                applyUpdate();
              }
            });
          }
        });

        // Check for updates immediately
        reg.update();

        // Check for updates every 30 seconds
        setInterval(() => {
          reg.update();
        }, 30000);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  return null; // This component doesn't render anything
}
