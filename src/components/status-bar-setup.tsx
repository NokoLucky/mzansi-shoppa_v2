'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function StatusBarSetup() {
  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        // Prevent the webview from drawing under the iOS status bar
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set the background color (light mode)
        await StatusBar.setBackgroundColor({ color: '#ffffff' });

        // Use dark text/icons on the light bar
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.warn('StatusBar plugin not available:', err);
      }
    };

    configureStatusBar();
  }, []);

  return null; // no visible UI
}
