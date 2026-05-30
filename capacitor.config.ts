import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carcino.vantage',
  appName: 'Vantage',
  webDir: 'out',
  server: {
    url: 'http://carcino.work/',
    cleartext: true
  }
};

export default config;