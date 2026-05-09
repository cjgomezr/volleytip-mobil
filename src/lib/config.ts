import Constants from 'expo-constants';

export type AppEnv = 'development' | 'production';

export interface AppConfig {
  appEnv:               AppEnv;
  supabaseUrl:          string;
  supabaseAnonKey:      string;
  revenuecatIosKey:     string;
  revenuecatAndroidKey: string;
  r2PublicUrl:          string; // Cloudflare R2 public base URL (e.g. https://videos.volleytip.app)
}

function loadConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra as Partial<AppConfig> | undefined;

  if (__DEV__ && !extra?.supabaseUrl) {
    console.warn(
      '[Config] supabaseUrl vacío.\n' +
      'Completá SUPABASE_URL en .env.development y reiniciá con: npm start'
    );
  }

  return {
    appEnv:               extra?.appEnv               ?? 'development',
    supabaseUrl:          extra?.supabaseUrl           ?? '',
    supabaseAnonKey:      extra?.supabaseAnonKey       ?? '',
    revenuecatIosKey:     extra?.revenuecatIosKey      ?? '',
    revenuecatAndroidKey: extra?.revenuecatAndroidKey  ?? '',
    r2PublicUrl:          extra?.r2PublicUrl            ?? '',
  };
}

export const appConfig = loadConfig();
