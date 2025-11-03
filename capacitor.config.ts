import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mzansishoppa.app',
  appName: 'Mzansi Shoppa',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      layoutName: "launch_screen",
      useDialog: true
    },
    StatusBar: {
      style: 'DEFAULT',
      overlaysWebView: false, // This is important - set to false
      backgroundColor: '#FFFFFF', // Match your theme
      translucent: false
    }
  }
};

export default config;
