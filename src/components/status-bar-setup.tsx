'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

const StatusBarSetup = () => {
  useEffect(() => {
    const setupStatusBar = async () => {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        try {
          // Set status bar style
          await StatusBar.setStyle({ style: Style.Dark });
          
          // Don't overlay the status bar
          await StatusBar.setOverlaysWebView({ overlay: false });
          
          // Set background color (optional)
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        } catch (error) {
          console.log('StatusBar not available in web context');
        }
      }
    };

    setupStatusBar();
  }, []);

  return null;
};

export default StatusBarSetup;