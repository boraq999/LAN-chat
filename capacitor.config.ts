import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lanchat.pro',
  appName: 'LAN Chat Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
