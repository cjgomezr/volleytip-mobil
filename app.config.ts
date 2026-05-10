// app.config.ts corre en contexto Node.js (evaluador de Expo), no en el bundle.
// Por eso usamos require() para dotenv y path.
/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv') as { config: (o: { path: string }) => void };
const path   = require('path')   as typeof import('path');

import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENV = (process.env.APP_ENV ?? 'development') as 'development' | 'production';

// Carga .env.development o .env.production según APP_ENV
dotenv.config({ path: path.resolve(__dirname, `.env.${APP_ENV}`) });

const IS_PROD = APP_ENV === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // En dev el nombre muestra el ambiente para distinguir fácilmente
  name:    IS_PROD ? 'VolleyTip' : 'VolleyTip (Dev)',
  slug:    'volleytip-app',
  version: '1.0.0',

  orientation:       'portrait',
  icon:              './assets/images/icon.png',
  scheme:            'volleytip',
  userInterfaceStyle: 'dark',
  newArchEnabled:    true,

  splash: {
    image:      './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#111116',
  },

  

  ios: {
    supportsTablet:   false,
    bundleIdentifier: IS_PROD ? 'com.volleytip.app' : 'com.volleytip.app.dev',
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#111116',
    },
    package:            IS_PROD ? 'com.volleytip.app' : 'com.volleytip.app.dev',
    edgeToEdgeEnabled:  true,
  },

  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-dev-client',
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-video',
    'expo-web-browser',
    'expo-localization',
    [
      'expo-image-picker',
      { photosPermission: 'Necesitamos acceso a tus fotos para actualizar tu avatar.' },
    ],
    // 'react-native-purchases' — agregar cuando se active RevenueCat en dev build
  ],

  experiments: { typedRoutes: true },

  // Las credenciales viajan por aquí (nunca en el bundle directamente).
  // La app las lee vía Constants.expoConfig.extra → src/lib/config.ts
  extra: {
    appEnv:               APP_ENV,
    supabaseUrl:          process.env.SUPABASE_URL          ?? '',
    supabaseAnonKey:      process.env.SUPABASE_ANON_KEY     ?? '',
    revenuecatIosKey:     process.env.REVENUECAT_IOS_KEY     ?? '',
    revenuecatAndroidKey: process.env.REVENUECAT_ANDROID_KEY ?? '',
    r2PublicUrl:          process.env.R2_PUBLIC_URL           ?? '',
    eas: {
      projectId: "156d9c99-788b-4cbf-a413-59b48a2c93cd"
    },
  },
});
