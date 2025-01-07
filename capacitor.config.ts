import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oxygetv.app',
  appName: 'OxygeTV',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
