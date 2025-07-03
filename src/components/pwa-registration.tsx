'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/'
            }
          );

          registration.addEventListener('updatefound', () => {
            console.log('Service worker update found');
            const installingWorker = registration.installing;

            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('New service worker available');
                    // You could show a toast notification here
                  } else {
                    // Service worker registered for the first time
                    console.log('Service worker registered for the first time');
                  }
                }
              });
            }
          });

          console.log('Service worker registered successfully:', registration);
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null; // This component doesn't render anything
}
