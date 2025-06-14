
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f1d1f4c01854431db8fe1cf7c1f006ce',
  appName: 'discord-profile-pal',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://f1d1f4c0-1854-431d-b8fe-1cf7c1f006ce.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
